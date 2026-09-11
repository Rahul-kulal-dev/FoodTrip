package com.foodtrip.entity.restaurant;

import com.foodtrip.entity.food.FoodItem;
import com.foodtrip.entity.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Entity
@Table(name = "foodtrip_restaurant")
@Getter
@Setter
@NoArgsConstructor
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String code;
    private String name;

    @Lob
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User ownerUser;

    private String owner;
    private String email;
    private String phone;

    @Column(name = "logo_image")
    private String logoImage;

    @Column(name = "cover_image")
    private String coverImage;

    @Enumerated(EnumType.STRING)
    private CuisineType cuisine = CuisineType.INDIAN;

    private String address;
    private String city;
    private String state;
    private String pincode;
    private String location;

    private String openingTime = "10:00";
    private String closingTime = "22:00";

    @ElementCollection(fetch = FetchType.LAZY)
    private List<String> workingDays = new ArrayList<>(List.of(
            "Monday", "Tuesday", "Wednesday", "Thursday",
            "Friday", "Saturday", "Sunday"
    ));

    private boolean isActive = true;
    private boolean isOpen = true;

    private String status = "PENDING";
    private String rejectionReason;

    private String fssaiLicenseNo;
    private String fssaiDocUrl;

    private Double rating = 4.5;

    private LocalDateTime createdDate;

    @OneToMany(
            mappedBy = "restaurant",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private List<FoodItem> foodItems = new ArrayList<>();

    @Transient
    public boolean isOpenNow() {
        if (!isOpen) {
            return false;
        }

        if (workingDays != null && !workingDays.isEmpty()) {
            String today = LocalDate.now(ZoneId.of("Asia/Kolkata"))
                    .getDayOfWeek()
                    .getDisplayName(TextStyle.FULL, Locale.ENGLISH);

            boolean dayMatches = workingDays.stream()
                    .anyMatch(d -> d.equalsIgnoreCase(today));
            if (!dayMatches) {
                return false;
            }
        }

        if (openingTime == null || openingTime.trim().isEmpty() ||
            closingTime == null || closingTime.trim().isEmpty()) {
            return true;
        }

        try {
            LocalTime now = LocalTime.now(ZoneId.of("Asia/Kolkata"));
            LocalTime open = parseTimeFlexible(openingTime);
            LocalTime close = parseTimeFlexible(closingTime);

            if (open == null || close == null) {
                return true;
            }

            if (open.equals(close)) {
                return true;
            }

            if (close.equals(LocalTime.MIDNIGHT) || close.equals(LocalTime.MIN)) {
                return !now.isBefore(open);
            }

            if (close.isAfter(open)) {
                return !now.isBefore(open) && now.isBefore(close);
            } else {
                return !now.isBefore(open) || now.isBefore(close);
            }
        } catch (Exception e) {
            return true;
        }
    }

    private LocalTime parseTimeFlexible(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) {
            return null;
        }
        String clean = timeStr.trim().toUpperCase();
        try {
            if (clean.contains("AM") || clean.contains("PM")) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("[h:mm a][hh:mm a][h:m a][hh:m a][h a][hh a]", Locale.ENGLISH);
                return LocalTime.parse(clean, formatter);
            }
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("[H:mm][:ss][HH:mm][:ss][H][:ss]");
            return LocalTime.parse(clean, formatter);
        } catch (Exception e) {
            return null;
        }
    }

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
    }
}