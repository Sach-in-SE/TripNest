package com.tripnest.dto;

import org.springframework.core.io.Resource;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DocumentDownloadResult {
    private Resource resource;
    private String originalFileName;
    private String contentType;
}
