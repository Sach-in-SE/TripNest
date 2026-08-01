package com.tripnest.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Entity
@Table(name = "destinations")
public class Destination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String country;

    @Size(max = 100)
    private String city;

    @Column(length = 1000)
    private String description;

    @Size(max = 200)
    private String imageUrl;

    @Size(max = 100)
    private String climate;

    @Size(max = 200)
    private String bestTimeToVisit;

    private Double averageCost;

    private boolean popular = false;
}