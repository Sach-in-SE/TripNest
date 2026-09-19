package com.tripnest.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripnest.dto.GroupMessageRequest;
import com.tripnest.dto.GroupMessageResponse;
import com.tripnest.exception.ResourceNotFoundException;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.service.GroupService;
import com.tripnest.tripnest.TripnestApplication;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = TripnestApplication.class)
@AutoConfigureMockMvc
public class GroupControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private GroupService groupService;

    @Test
    @DisplayName("GET /api/groups/{id}/messages - Unauthenticated request returns 401 Unauthorized")
    void testGetMessages_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/groups/100/messages"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/groups/{id}/messages - Authenticated authorized member returns 200 OK")
    void testGetMessages_AuthorizedMember_Returns200() throws Exception {
        UserDetailsImpl member = new UserDetailsImpl(2L, "member", "member@test.com", "pass", Collections.emptyList());
        GroupMessageResponse response = new GroupMessageResponse();
        response.setId(1L);
        response.setGroupId(100L);
        response.setContent("Hello group");
        response.setSenderId(2L);
        response.setSenderUsername("member");
        response.setCreatedAt(LocalDateTime.now());
        response.setIsSelf(true);

        when(groupService.getGroupMessages(eq(100L), eq(2L))).thenReturn(List.of(response));

        mockMvc.perform(get("/api/groups/100/messages").with(user(member)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].content").value("Hello group"))
                .andExpect(jsonPath("$[0].senderUsername").value("member"))
                .andExpect(jsonPath("$[0].isSelf").value(true));
    }

    @Test
    @DisplayName("GET /api/groups/{id}/messages - Authenticated unauthorized user returns 403 Forbidden")
    void testGetMessages_UnauthorizedUser_Returns403() throws Exception {
        UserDetailsImpl intruder = new UserDetailsImpl(99L, "intruder", "intruder@test.com", "pass", Collections.emptyList());

        when(groupService.getGroupMessages(eq(100L), eq(99L)))
                .thenThrow(new AccessDeniedException("You are not a member of this group"));

        mockMvc.perform(get("/api/groups/100/messages").with(user(intruder)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("not a member")));
    }

    @Test
    @DisplayName("GET /api/groups/{id}/messages - Non-existent group returns 404 Not Found")
    void testGetMessages_NonExistentGroup_Returns404() throws Exception {
        UserDetailsImpl user = new UserDetailsImpl(1L, "user", "user@test.com", "pass", Collections.emptyList());

        when(groupService.getGroupMessages(eq(999L), eq(1L)))
                .thenThrow(new ResourceNotFoundException("Group not found"));

        mockMvc.perform(get("/api/groups/999/messages").with(user(user)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Group not found")));
    }

    @Test
    @DisplayName("POST /api/groups/{id}/messages - Authenticated authorized member returns 200 OK")
    void testSendMessage_AuthorizedMember_Returns200() throws Exception {
        UserDetailsImpl member = new UserDetailsImpl(2L, "member", "member@test.com", "pass", Collections.emptyList());
        GroupMessageRequest request = new GroupMessageRequest();
        request.setContent("Let's meet at 10 AM");

        GroupMessageResponse response = new GroupMessageResponse();
        response.setId(20L);
        response.setGroupId(100L);
        response.setContent("Let's meet at 10 AM");
        response.setSenderId(2L);
        response.setSenderUsername("member");
        response.setCreatedAt(LocalDateTime.now());
        response.setIsSelf(true);

        when(groupService.sendGroupMessage(eq(100L), any(GroupMessageRequest.class), eq(2L)))
                .thenReturn(response);

        mockMvc.perform(post("/api/groups/100/messages")
                        .with(user(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(20L))
                .andExpect(jsonPath("$.content").value("Let's meet at 10 AM"))
                .andExpect(jsonPath("$.senderUsername").value("member"));
    }

    @Test
    @DisplayName("POST /api/groups/{id}/messages - Unauthorized user returns 403 Forbidden")
    void testSendMessage_UnauthorizedUser_Returns403() throws Exception {
        UserDetailsImpl intruder = new UserDetailsImpl(99L, "intruder", "intruder@test.com", "pass", Collections.emptyList());
        GroupMessageRequest request = new GroupMessageRequest();
        request.setContent("Spam message");

        when(groupService.sendGroupMessage(eq(100L), any(GroupMessageRequest.class), eq(99L)))
                .thenThrow(new AccessDeniedException("You are not a member of this group"));

        mockMvc.perform(post("/api/groups/100/messages")
                        .with(user(intruder))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("not a member")));
    }

    @Test
    @DisplayName("POST /api/groups/{id}/messages - Non-existent group returns 404 Not Found")
    void testSendMessage_NonExistentGroup_Returns404() throws Exception {
        UserDetailsImpl user = new UserDetailsImpl(1L, "user", "user@test.com", "pass", Collections.emptyList());
        GroupMessageRequest request = new GroupMessageRequest();
        request.setContent("Message for nobody");

        when(groupService.sendGroupMessage(eq(999L), any(GroupMessageRequest.class), eq(1L)))
                .thenThrow(new ResourceNotFoundException("Group not found"));

        mockMvc.perform(post("/api/groups/999/messages")
                        .with(user(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Group not found")));
    }

    @Test
    @DisplayName("POST /api/groups/{id}/messages - Blank message returns 400 Bad Request")
    void testSendMessage_BlankContent_Returns400() throws Exception {
        UserDetailsImpl member = new UserDetailsImpl(2L, "member", "member@test.com", "pass", Collections.emptyList());
        GroupMessageRequest request = new GroupMessageRequest();
        request.setContent("   ");

        mockMvc.perform(post("/api/groups/100/messages")
                        .with(user(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/groups/{id}/messages - Content over 1000 characters returns 400 Bad Request")
    void testSendMessage_ContentOver1000Chars_Returns400() throws Exception {
        UserDetailsImpl member = new UserDetailsImpl(2L, "member", "member@test.com", "pass", Collections.emptyList());
        GroupMessageRequest request = new GroupMessageRequest();
        request.setContent("x".repeat(1001));

        mockMvc.perform(post("/api/groups/100/messages")
                        .with(user(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/groups/{id}/messages - Sender identity cannot be spoofed via request payload")
    void testSendMessage_SenderCannotBeSpoofed() throws Exception {
        UserDetailsImpl legitimateUser = new UserDetailsImpl(2L, "legit", "legit@test.com", "pass", Collections.emptyList());

        // Attacker attempts to pass senderId or senderUsername in JSON
        String maliciousPayload = "{\"content\":\"Test spoof\",\"senderId\":1,\"senderUsername\":\"admin\"}";

        GroupMessageResponse response = new GroupMessageResponse();
        response.setId(30L);
        response.setGroupId(100L);
        response.setContent("Test spoof");
        response.setSenderId(2L); // bound to legitimateUser
        response.setSenderUsername("legit");
        response.setCreatedAt(LocalDateTime.now());
        response.setIsSelf(true);

        when(groupService.sendGroupMessage(eq(100L), any(GroupMessageRequest.class), eq(2L)))
                .thenReturn(response);

        mockMvc.perform(post("/api/groups/100/messages")
                        .with(user(legitimateUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(maliciousPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.senderId").value(2L))
                .andExpect(jsonPath("$.senderUsername").value("legit"));

        // Verify the service was called strictly with the authenticated principal ID (2L), NOT 1L
        verify(groupService).sendGroupMessage(eq(100L), any(GroupMessageRequest.class), eq(2L));
    }
}
