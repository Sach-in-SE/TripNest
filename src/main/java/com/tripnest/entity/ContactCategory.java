package com.tripnest.entity;

public enum ContactCategory {
    GENERAL_INQUIRY("General Inquiry"),
    BUG_REPORT("Bug Report"),
    FEEDBACK("Product Feedback"),
    FEATURE_REQUEST("Feature Request"),
    OTHER("Other");

    private final String displayName;

    ContactCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
