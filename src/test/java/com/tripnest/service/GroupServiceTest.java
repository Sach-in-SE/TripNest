package com.tripnest.service;

import com.tripnest.dto.GroupMessageRequest;
import com.tripnest.dto.GroupMessageResponse;
import com.tripnest.entity.*;
import com.tripnest.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
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
    private GroupMessageRepository groupMessageRepository;

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

    @Test
    void testSendGroupMessage_ActiveMember_Success() {
        when(groupRepository.findById(100L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByTravelGroupIdAndUserId(100L, 2L)).thenReturn(Optional.of(newOwnerMembership));
        when(userRepository.findById(2L)).thenReturn(Optional.of(newOwner));
        when(groupMessageRepository.save(any(GroupMessage.class))).thenAnswer(i -> {
            GroupMessage msg = i.getArgument(0);
            msg.setId(500L);
            msg.setCreatedAt(LocalDateTime.now());
            return msg;
        });

        GroupMessageRequest request = new GroupMessageRequest();
        request.setContent("Hello group!");

        GroupMessageResponse response = groupService.sendGroupMessage(100L, request, 2L);

        assertNotNull(response);
        assertEquals(500L, response.getId());
        assertEquals("Hello group!", response.getContent());
        assertEquals(2L, response.getSenderId());
        assertTrue(response.getIsSelf());
        verify(groupMessageRepository).save(any(GroupMessage.class));
    }

    @Test
    void testSendGroupMessage_Owner_Success() {
        when(groupRepository.findById(100L)).thenReturn(Optional.of(group));
        when(userRepository.findById(1L)).thenReturn(Optional.of(currentOwner));
        when(groupMessageRepository.save(any(GroupMessage.class))).thenAnswer(i -> {
            GroupMessage msg = i.getArgument(0);
            msg.setId(501L);
            msg.setCreatedAt(LocalDateTime.now());
            return msg;
        });

        GroupMessageRequest request = new GroupMessageRequest();
        request.setContent("Welcome everyone");

        GroupMessageResponse response = groupService.sendGroupMessage(100L, request, 1L);

        assertNotNull(response);
        assertEquals(501L, response.getId());
        assertEquals("Welcome everyone", response.getContent());
        assertEquals(1L, response.getSenderId());
        assertTrue(response.getIsSelf());
    }

    @Test
    void testGetGroupMessages_ActiveMember_ReturnsChronologicalMessages() {
        when(groupRepository.findById(100L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByTravelGroupIdAndUserId(100L, 2L)).thenReturn(Optional.of(newOwnerMembership));

        GroupMessage msg1 = new GroupMessage();
        msg1.setId(1L);
        msg1.setTravelGroup(group);
        msg1.setSender(currentOwner);
        msg1.setContent("First msg");
        msg1.setCreatedAt(LocalDateTime.now().minusMinutes(5));

        GroupMessage msg2 = new GroupMessage();
        msg2.setId(2L);
        msg2.setTravelGroup(group);
        msg2.setSender(newOwner);
        msg2.setContent("Second msg");
        msg2.setCreatedAt(LocalDateTime.now());

        when(groupMessageRepository.findByTravelGroupIdOrderByCreatedAtAsc(100L)).thenReturn(List.of(msg1, msg2));

        List<GroupMessageResponse> responses = groupService.getGroupMessages(100L, 2L);

        assertEquals(2, responses.size());
        assertEquals("First msg", responses.get(0).getContent());
        assertFalse(responses.get(0).getIsSelf());
        assertEquals("Second msg", responses.get(1).getContent());
        assertTrue(responses.get(1).getIsSelf());
    }

    @Test
    void testSendGroupMessage_NonMember_ThrowsException() {
        when(groupRepository.findById(100L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByTravelGroupIdAndUserId(100L, 99L)).thenReturn(Optional.empty());

        GroupMessageRequest request = new GroupMessageRequest();
        request.setContent("Sneaky message");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            groupService.sendGroupMessage(100L, request, 99L);
        });

        assertEquals("You are not a member of this group", ex.getMessage());
        verify(groupMessageRepository, never()).save(any());
    }

    @Test
    void testGetGroupMessages_NonMember_ThrowsException() {
        when(groupRepository.findById(100L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByTravelGroupIdAndUserId(100L, 99L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            groupService.getGroupMessages(100L, 99L);
        });

        assertEquals("You are not a member of this group", ex.getMessage());
    }

    @Test
    void testSendGroupMessage_RemovedOrLeftMember_ThrowsException() {
        when(groupRepository.findById(100L)).thenReturn(Optional.of(group));
        GroupMember pendingMember = new GroupMember();
        pendingMember.setUser(newOwner);
        pendingMember.setStatus(GroupInvitationStatus.PENDING);
        when(groupMemberRepository.findByTravelGroupIdAndUserId(100L, 2L)).thenReturn(Optional.of(pendingMember));

        GroupMessageRequest request = new GroupMessageRequest();
        request.setContent("Inactive member msg");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            groupService.sendGroupMessage(100L, request, 2L);
        });

        assertTrue(ex.getMessage().contains("Your membership is not active"));
        verify(groupMessageRepository, never()).save(any());
    }

    @Test
    void testDeleteGroup_RemovesMessagesSafely() {
        when(groupRepository.findById(100L)).thenReturn(Optional.of(group));

        groupService.deleteGroup(100L, 1L);

        verify(groupMessageRepository).deleteByTravelGroupId(100L);
        verify(groupMemberRepository).deleteByTravelGroupId(100L);
        verify(groupRepository).delete(group);
    }
}
