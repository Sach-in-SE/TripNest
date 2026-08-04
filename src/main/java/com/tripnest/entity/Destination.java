package com.tripnest.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Entity
@Table(name = "destinations")
public class Destination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(unique = true)
    private String name;

    @Size(max = 100)
    private String state;

    @Size(max = 100)
    private String country;

    @Column(length = 1000)
    private String description;

    @Size(max = 100)
    private String category;

    @Size(max = 500)
    private String imageUrl;

    @Size(max = 100)
    private String bestSeason;

    private Double estimatedBudget;

    private Integer recommendedDays;

    private Double latitude;

    private Double longitude;

    private Double rating;
}