package com.tripnest.service;

import com.tripnest.dto.GroupRequest;
import com.tripnest.dto.GroupResponse;
import com.tripnest.entity.TravelGroup;
import com.tripnest.entity.Trip;
import com.tripnest.entity.User;
import com.tripnest.repository.GroupRepository;
import com.tripnest.repository.TripRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    public GroupResponse createGroup(GroupRequest request, Long userId) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        TravelGroup group = new TravelGroup();
        group.setName(request.getName());
        group.setDescription(request.getDescription());
        group.setCreatedBy(creator);
        group.setTrip(trip);

        Set<User> members = new HashSet<>();
        members.add(creator);

        if (request.getMemberIds() != null) {
            for (Long memberId : request.getMemberIds()) {
                userRepository.findById(memberId).ifPresent(members::add);
            }
        }
        group.setMembers(members);

        TravelGroup saved = groupRepository.save(group);
        return mapToResponse(saved);
    }

    public List<GroupResponse> getUserGroups(Long userId) {
        List<TravelGroup> created = groupRepository.findByCreatedById(userId);
        List<TravelGroup> member = groupRepository.findByMembersId(userId);

        Set<TravelGroup> allGroups = new HashSet<>();
        allGroups.addAll(created);
        allGroups.addAll(member);

        return allGroups.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<GroupResponse> getTripGroups(Long tripId) {
        return groupRepository.findByTripId(tripId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public GroupResponse addMember(Long groupId, Long memberId, Long userId) {
        TravelGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (!group.getCreatedBy().getId().equals(userId)) {
            throw new RuntimeException("Only group admin can add members");
        }

        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        group.getMembers().add(member);
        TravelGroup updated = groupRepository.save(group);
        return mapToResponse(updated);
    }

    public void deleteGroup(Long groupId, Long userId) {
        TravelGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (!group.getCreatedBy().getId().equals(userId)) {
            throw new RuntimeException("Only group admin can delete group");
        }

        groupRepository.delete(group);
    }

    private GroupResponse mapToResponse(TravelGroup group) {
        GroupResponse response = new GroupResponse();
        response.setId(group.getId());
        response.setName(group.getName());
        response.setDescription(group.getDescription());
        response.setTripId(group.getTrip().getId());
        response.setTripTitle(group.getTrip().getTitle());
        response.setCreatedById(group.getCreatedBy().getId());
        response.setCreatedByUsername(group.getCreatedBy().getUsername());
        response.setMemberUsernames(group.getMembers().stream()
                .map(User::getUsername)
                .collect(Collectors.toList()));
        response.setMemberCount(group.getMembers().size());
        response.setCreatedAt(group.getCreatedAt());
        response.setUpdatedAt(group.getUpdatedAt());
        return response;
    }
}