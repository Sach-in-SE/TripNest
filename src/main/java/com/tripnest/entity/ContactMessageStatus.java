package com.tripnest.entity;

public enum ContactMessageStatus {
    NEW("New"),
    READ("Read"),
    RESOLVED("Resolved"),
    ARCHIVED("Archived");

    private final String displayName;

    ContactMessageStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
