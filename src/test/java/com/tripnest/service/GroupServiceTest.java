package com.tripnest.service;

import com.tripnest.entity.*;
import com.tripnest.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private TripShareRepository tripShareRepository;

    @Mock
    private TravelUpdateNotificationService travelUpdateNotificationService;

    @InjectMocks
    private GroupService groupService;

    private User currentOwner;
    private User newOwner;
    private Trip trip;
    private TravelGroup group;
    private GroupMember newOwnerMembership;
    private GroupMember currentOwnerMembership;

    @BeforeEach
    void setUp() {
        currentOwner = new User();
        currentOwner.setId(1L);
        currentOwner.setUsername("owner");

        newOwner = new User();
        newOwner.setId(2L);
        newOwner.setUsername("newowner");

        trip = new Trip();
        trip.setId(10L);
        trip.setTitle("Paris Trip");
        trip.setUser(currentOwner);

        group = new TravelGroup();
        group.setId(100L);
        group.setName("Paris Travelers");
        group.setCreatedBy(currentOwner);
        group.setTrip(trip);

        newOwnerMembership = new GroupMember();
        newOwnerMembership.setId(201L);
        newOwnerMembership.setUser(newOwner);
        newOwnerMembership.setTravelGroup(group);
        newOwnerMembership.setRole(GroupRole.MEMBER);
        newOwnerMembership.setStatus(GroupInvitationStatus.ACCEPTED);

        currentOwnerMembership = new GroupMember();
        currentOwnerMembership.setId(202L);
        currentOwnerMembership.setUser(currentOwner);
        currentOwnerMembership.setTravelGroup(group);
        currentOwnerMembership.setRole(GroupRole.OWNER);
        currentOwnerMembership.setStatus(GroupInvitationStatus.ACCEPTED);
    }

    @Test
    void testTransferOwnership_Success_TriggersNotificationAndUpdatesTripOwner() {
        when(groupRepository.findById(100L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByTravelGroupIdAndUserId(100L, 2L)).thenReturn(Optional.of(newOwnerMembership));
        when(groupMemberRepository.findByTravelGroupIdAndUserId(100L, 1L)).thenReturn(Optional.of(currentOwnerMembership));
        when(userRepository.findById(2L)).thenReturn(Optional.of(newOwner));
        when(userRepository.findById(1L)).thenReturn(Optional.of(currentOwner));

        groupService.transferOwnership(100L, 2L, 1L);

        assertEquals(newOwner, group.getCreatedBy());
        assertEquals(GroupRole.OWNER, newOwnerMembership.getRole());
        assertEquals(GroupRole.MEMBER, currentOwnerMembership.getRole());
        assertEquals(newOwner, trip.getUser());

        verify(groupRepository).save(group);
        verify(tripRepository).save(trip);
        verify(travelUpdateNotificationService).notifyOwnershipTransferred(10L, 1L, 2L);
    }

    @Test
    void testTransferOwnership_ToSelf_ThrowsException() {
        when(groupRepository.findById(100L)).thenReturn(Optional.of(group));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            groupService.transferOwnership(100L, 1L, 1L);
        });

        assertEquals("You cannot transfer ownership to yourself", exception.getMessage());
        verify(travelUpdateNotificationService, never()).notifyOwnershipTransferred(any(), any(), any());
    }

    @Test
    void testTransferOwnership_NonMember_ThrowsException() {
        when(groupRepository.findById(100L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByTravelGroupIdAndUserId(100L, 2L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            groupService.transferOwnership(100L, 2L, 1L);
        });

        assertEquals("User is not a member of this group", exception.getMessage());
        verify(travelUpdateNotificationService, never()).notifyOwnershipTransferred(any(), any(), any());
    }
}
