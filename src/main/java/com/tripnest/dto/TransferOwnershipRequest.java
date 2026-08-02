package com.tripnest.dto;

import lombok.Data;

@Data
public class TransferOwnershipRequest {
    private Long newOwnerId;
}