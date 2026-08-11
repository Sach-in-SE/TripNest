package com.tripnest.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GroupMessageResponse {
    private Long id;
    private Long groupId;
    private Long senderId;
    private String senderName;
    private String senderUsername;
    private String content;
    private LocalDateTime createdAt;
    private Boolean isSelf;
}
