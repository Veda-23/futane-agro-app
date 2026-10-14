package com.futaneagro.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class StorefrontCatalogItemDTO {
    private String id;
    private String crateType;
    private String materialType;
    private Integer availableStock;
    private BigDecimal basePrice;
    private String category;
    private String shortDescription;
    private String dimensions;
    private String loadCapacity;
    private String tareWeight;
    private String foodGradeRating;
    private String image;
    private List<String> availableColors;
    private Map<String, BigDecimal> volumeTiers;

    public StorefrontCatalogItemDTO() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCrateType() { return crateType; }
    public void setCrateType(String crateType) { this.crateType = crateType; }

    public String getMaterialType() { return materialType; }
    public void setMaterialType(String materialType) { this.materialType = materialType; }

    public Integer getAvailableStock() { return availableStock; }
    public void setAvailableStock(Integer availableStock) { this.availableStock = availableStock; }

    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getShortDescription() { return shortDescription; }
    public void setShortDescription(String shortDescription) { this.shortDescription = shortDescription; }

    public String getDimensions() { return dimensions; }
    public void setDimensions(String dimensions) { this.dimensions = dimensions; }

    public String getLoadCapacity() { return loadCapacity; }
    public void setLoadCapacity(String loadCapacity) { this.loadCapacity = loadCapacity; }

    public String getTareWeight() { return tareWeight; }
    public void setTareWeight(String tareWeight) { this.tareWeight = tareWeight; }

    public String getFoodGradeRating() { return foodGradeRating; }
    public void setFoodGradeRating(String foodGradeRating) { this.foodGradeRating = foodGradeRating; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public List<String> getAvailableColors() { return availableColors; }
    public void setAvailableColors(List<String> availableColors) { this.availableColors = availableColors; }

    public Map<String, BigDecimal> getVolumeTiers() { return volumeTiers; }
    public void setVolumeTiers(Map<String, BigDecimal> volumeTiers) { this.volumeTiers = volumeTiers; }
}
