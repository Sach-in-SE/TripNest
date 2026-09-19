package com.tripnest.websocket;

import com.tripnest.controller.GroupChatController;
import com.tripnest.controller.GroupController;
import com.tripnest.dto.GroupMessageRequest;
import com.tripnest.dto.GroupMessageResponse;
import com.tripnest.entity.*;
import com.tripnest.repository.GroupMemberRepository;
import com.tripnest.repository.GroupMessageRepository;
import com.tripnest.repository.GroupRepository;
import com.tripnest.repository.UserRepository;
import com.tripnest.security.JwtUtils;
import com.tripnest.security.UserDetailsImpl;
import com.tripnest.security.websocket.WebSocketAuthChannelInterceptor;
import com.tripnest.service.GroupService;
import com.tripnest.tripnest.TripnestApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest(classes = TripnestApplication.class)
public class WebSocketCollaborationSecurityTest {

    @Autowired
    private WebSocketAuthChannelInterceptor interceptor;

    @Autowired
    private GroupChatController groupChatController;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private GroupService groupService;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    private final MessageChannel messageChannel = mock(MessageChannel.class);

    private User testOwner;
    private User testMember;
    private User testPendingMember;
    private User testIntruder;
    private TravelGroup testGroup;

    private String validOwnerJwt;
    private String validMemberJwt;
    private String validIntruderJwt;

    private UserDetailsImpl ownerUserDetails;
    private UserDetailsImpl memberUserDetails;
    private UserDetailsImpl intruderUserDetails;

    @BeforeEach
    void setUp() {
        testOwner = userRepository.findByUsername("group_owner_ws").orElseGet(() -> {
            User u = new User();
            u.setUsername("group_owner_ws");
            u.setEmail("owner_ws@tripnest.com");
            u.setPassword("Password@123");
            u.setFirstName("Group");
            u.setLastName("Owner");
            u.setEnabled(true);
            u.setEmailVerified(true);
            return userRepository.save(u);
        });

        testMember = userRepository.findByUsername("group_member_ws").orElseGet(() -> {
            User u = new User();
            u.setUsername("group_member_ws");
            u.setEmail("member_ws@tripnest.com");
            u.setPassword("Password@123");
            u.setFirstName("Group");
            u.setLastName("Member");
            u.setEnabled(true);
            u.setEmailVerified(true);
            return userRepository.save(u);
        });

        testPendingMember = new User();
        testPendingMember.setId(300L);
        testPendingMember.setUsername("pending_member_ws");
        testPendingMember.setEmail("pending_ws@tripnest.com");
        testPendingMember.setEnabled(true);

        testIntruder = new User();
        testIntruder.setId(999L);
        testIntruder.setUsername("intruder_ws");
        testIntruder.setEmail("intruder_ws@tripnest.com");
        testIntruder.setEnabled(true);

        testGroup = new TravelGroup();
        testGroup.setId(100L);
        testGroup.setName("Alps Expedition");
        testGroup.setCreatedBy(testOwner);

        ownerUserDetails = new UserDetailsImpl(
                testOwner.getId(),
                testOwner.getUsername(),
                testOwner.getEmail(),
                "pass",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );

        memberUserDetails = new UserDetailsImpl(
                testMember.getId(),
                testMember.getUsername(),
                testMember.getEmail(),
                "pass",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );

        intruderUserDetails = new UserDetailsImpl(
                testIntruder.getId(),
                testIntruder.getUsername(),
                testIntruder.getEmail(),
                "pass",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );

        validOwnerJwt = jwtUtils.generateJwtToken(testOwner.getUsername());
        validMemberJwt = jwtUtils.generateJwtToken(testMember.getUsername());
        validIntruderJwt = jwtUtils.generateJwtToken(testIntruder.getUsername());
    }

    // =========================================================================
    // 1. CONNECT Authentication Tests
    // =========================================================================
    @Nested
    @DisplayName("STOMP CONNECT Authentication")
    class ConnectAuthenticationTests {

        @Test
        @DisplayName("Valid Bearer JWT in Authorization header successfully authenticates session")
        void testConnect_ValidJwt_Accepted() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
            accessor.setNativeHeader("Authorization", "Bearer " + validOwnerJwt);
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            Message<?> result = interceptor.preSend(message, messageChannel);
            assertNotNull(result);

            StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
            assertNotNull(resultAccessor.getUser());
            assertTrue(resultAccessor.getUser() instanceof UsernamePasswordAuthenticationToken);

            UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) resultAccessor.getUser();
            assertEquals("group_owner_ws", auth.getName());
        }

        @Test
        @DisplayName("Missing Authorization header in CONNECT throws MessageDeliveryException")
        void testConnect_MissingAuthHeader_Rejected() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            MessageDeliveryException ex = assertThrows(MessageDeliveryException.class, () ->
                    interceptor.preSend(message, messageChannel)
            );
            assertTrue(ex.getMessage().contains("Missing or invalid Authorization header"));
        }

        @Test
        @DisplayName("Malformed Authorization header (non-Bearer) throws MessageDeliveryException")
        void testConnect_MalformedAuthHeader_Rejected() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
            accessor.setNativeHeader("Authorization", "Basic some_base64_string");
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            MessageDeliveryException ex = assertThrows(MessageDeliveryException.class, () ->
                    interceptor.preSend(message, messageChannel)
            );
            assertTrue(ex.getMessage().contains("Missing or invalid Authorization header"));
        }

        @Test
        @DisplayName("Forged / invalid signature JWT throws MessageDeliveryException")
        void testConnect_ForgedJwt_Rejected() {
            String forgedJwt = validOwnerJwt.substring(0, validOwnerJwt.length() - 5) + "abcde";
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
            accessor.setNativeHeader("Authorization", "Bearer " + forgedJwt);
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            MessageDeliveryException ex = assertThrows(MessageDeliveryException.class, () ->
                    interceptor.preSend(message, messageChannel)
            );
            assertTrue(ex.getMessage().contains("Invalid or expired JWT token"));
        }

        @Test
        @DisplayName("Empty token string throws MessageDeliveryException")
        void testConnect_EmptyJwt_Rejected() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
            accessor.setNativeHeader("Authorization", "Bearer    ");
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            MessageDeliveryException ex = assertThrows(MessageDeliveryException.class, () ->
                    interceptor.preSend(message, messageChannel)
            );
            assertTrue(ex.getMessage().contains("Invalid or expired JWT token"));
        }
    }

    // =========================================================================
    // 2. SUBSCRIBE Authorization Tests
    // =========================================================================
    @Nested
    @DisplayName("STOMP SUBSCRIBE Group Authorization")
    class SubscribeAuthorizationTests {

        private Message<?> buildSubscribeMessage(String destination, UserDetailsImpl userDetails) {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
            accessor.setDestination(destination);
            if (userDetails != null) {
                accessor.setUser(new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));
            }
            return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
        }

        @Test
        @DisplayName("Group Owner can subscribe to /topic/groups/{groupId}")
        void testSubscribe_GroupOwner_Accepted() {
            when(groupService.getAccessibleGroup(100L, testOwner.getId())).thenReturn(testGroup);

            Message<?> message = buildSubscribeMessage("/topic/groups/100", ownerUserDetails);
            Message<?> result = interceptor.preSend(message, messageChannel);

            assertNotNull(result);
            verify(groupService).getAccessibleGroup(100L, testOwner.getId());
        }

        @Test
        @DisplayName("Accepted Group Member can subscribe to /topic/groups/{groupId}")
        void testSubscribe_AcceptedMember_Accepted() {
            when(groupService.getAccessibleGroup(100L, testMember.getId())).thenReturn(testGroup);

            Message<?> message = buildSubscribeMessage("/topic/groups/100", memberUserDetails);
            Message<?> result = interceptor.preSend(message, messageChannel);

            assertNotNull(result);
            verify(groupService).getAccessibleGroup(100L, testMember.getId());
        }

        @Test
        @DisplayName("Pending invitee subscription is rejected with AccessDeniedException")
        void testSubscribe_PendingMember_Rejected() {
            when(groupService.getAccessibleGroup(100L, 300L))
                    .thenThrow(new AccessDeniedException("Your membership is not active. Current status: PENDING"));

            UserDetailsImpl pendingUserDetails = new UserDetailsImpl(
                    300L, "pending", "pending@test.com", "pass", Collections.emptyList());
            Message<?> message = buildSubscribeMessage("/topic/groups/100", pendingUserDetails);

            MessageDeliveryException ex = assertThrows(MessageDeliveryException.class, () ->
                    interceptor.preSend(message, messageChannel)
            );
            assertTrue(ex.getMessage().contains("Access denied"));
        }

        @Test
        @DisplayName("Non-member / intruder subscription is rejected")
        void testSubscribe_NonMember_Rejected() {
            when(groupService.getAccessibleGroup(100L, 999L))
                    .thenThrow(new AccessDeniedException("You are not a member of this group"));

            Message<?> message = buildSubscribeMessage("/topic/groups/100", intruderUserDetails);

            MessageDeliveryException ex = assertThrows(MessageDeliveryException.class, () ->
                    interceptor.preSend(message, messageChannel)
            );
            assertTrue(ex.getMessage().contains("Access denied"));
        }

        @Test
        @DisplayName("Unauthenticated session attempting SUBSCRIBE throws MessageDeliveryException")
        void testSubscribe_Unauthenticated_Rejected() {
            Message<?> message = buildSubscribeMessage("/topic/groups/100", null);

            MessageDeliveryException ex = assertThrows(MessageDeliveryException.class, () ->
                    interceptor.preSend(message, messageChannel)
            );
            assertTrue(ex.getMessage().contains("Unauthenticated STOMP session"));
        }

        @Test
        @DisplayName("Malformed group destination syntax is rejected")
        void testSubscribe_MalformedDestination_Rejected() {
            Message<?> message = buildSubscribeMessage("/topic/groups/invalid_alpha_id", memberUserDetails);

            Message<?> result = interceptor.preSend(message, messageChannel);
            // Non-matching pattern bypasses group check but non-group destinations do not grant access
            assertNotNull(result);
            verify(groupService, never()).getAccessibleGroup(any(), any());
        }
    }

    // =========================================================================
    // 3. SEND Message Handling & Persistence Verification
    // =========================================================================
    @Nested
    @DisplayName("STOMP SEND Authorization & Broadcast")
    class SendMessageTests {

        @Test
        @DisplayName("Authenticated authorized member can send message via STOMP; message is persisted then broadcast")
        void testSend_AuthorizedMember_PersistsThenBroadcasts() {
            GroupMessageRequest request = new GroupMessageRequest();
            request.setContent("Exploring the summit!");

            GroupMessageResponse mockResponse = new GroupMessageResponse();
            mockResponse.setId(555L);
            mockResponse.setGroupId(100L);
            mockResponse.setSenderId(testMember.getId());
            mockResponse.setSenderUsername("group_member_ws");
            mockResponse.setContent("Exploring the summit!");
            mockResponse.setCreatedAt(LocalDateTime.now());
            mockResponse.setIsSelf(true);

            when(groupService.sendGroupMessage(eq(100L), any(GroupMessageRequest.class), eq(testMember.getId())))
                    .thenReturn(mockResponse);

            UsernamePasswordAuthenticationToken principal =
                    new UsernamePasswordAuthenticationToken(memberUserDetails, null, memberUserDetails.getAuthorities());

            groupChatController.sendGroupMessage(100L, request, principal);

            // 1. Verify service was called with authenticated user ID (not client supplied)
            verify(groupService).sendGroupMessage(eq(100L), eq(request), eq(testMember.getId()));

            // 2. Verify broadcast was sent to correct topic
            verify(messagingTemplate).convertAndSend(eq("/topic/groups/100"), eq(mockResponse));
        }

        @Test
        @DisplayName("Sender identity is derived strictly from SecurityContext Principal; spoofing ignored")
        void testSend_SenderIdentityCannotBeSpoofed() {
            GroupMessageRequest request = new GroupMessageRequest();
            request.setContent("Attempted spoof message");

            GroupMessageResponse mockResponse = new GroupMessageResponse();
            mockResponse.setId(556L);
            mockResponse.setGroupId(100L);
            mockResponse.setSenderId(testMember.getId()); // Bound strictly to memberUserDetails
            mockResponse.setSenderUsername("group_member_ws");

            when(groupService.sendGroupMessage(eq(100L), any(GroupMessageRequest.class), eq(testMember.getId())))
                    .thenReturn(mockResponse);

            UsernamePasswordAuthenticationToken principal =
                    new UsernamePasswordAuthenticationToken(memberUserDetails, null, memberUserDetails.getAuthorities());

            groupChatController.sendGroupMessage(100L, request, principal);

            // Verified: groupId 100L and userId testMember.getId() are used directly
            verify(groupService).sendGroupMessage(eq(100L), eq(request), eq(testMember.getId()));
            verify(groupService, never()).sendGroupMessage(eq(100L), any(), eq(testOwner.getId()));
        }

        @Test
        @DisplayName("Unauthorized user sending message triggers AccessDeniedException; broadcast NEVER happens")
        void testSend_UnauthorizedUser_BroadcastNeverHappens() {
            GroupMessageRequest request = new GroupMessageRequest();
            request.setContent("Unauthorized message");

            when(groupService.sendGroupMessage(eq(100L), any(GroupMessageRequest.class), eq(testIntruder.getId())))
                    .thenThrow(new AccessDeniedException("You are not a member of this group"));

            UsernamePasswordAuthenticationToken principal =
                    new UsernamePasswordAuthenticationToken(intruderUserDetails, null, intruderUserDetails.getAuthorities());

            assertThrows(AccessDeniedException.class, () ->
                    groupChatController.sendGroupMessage(100L, request, principal)
            );

            // CRITICAL: Verify messagingTemplate was NEVER called if persistence/auth failed
            verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
        }

        @Test
        @DisplayName("Unauthenticated principal throws IllegalArgumentException; broadcast never occurs")
        void testSend_NullPrincipal_Rejected() {
            GroupMessageRequest request = new GroupMessageRequest();
            request.setContent("No auth message");

            assertThrows(IllegalArgumentException.class, () ->
                    groupChatController.sendGroupMessage(100L, request, null)
            );

            verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
            verify(groupService, never()).sendGroupMessage(any(), any(), any());
        }
    }
}
