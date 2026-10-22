package com.futaneagro.entity;

import javax.persistence.*;
import org.hibernate.annotations.Where;

/**
 * <h1>Team Entity (Organizational Departments & Functional Divisions)</h1>
 * <p>
 * Maps to table {@code t_core_team}. Represents functional organizational departments
 * (e.g., Production, Sales & Marketing, Logistics, Quality Assurance, HR, Accounts).
 * Configures portal navigation layout, sidebar sequence order, and visual badges.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_core_team")
@Where(clause = "is_active = true")
public class Team extends BaseEntity {

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "color_tag", length = 30)
    private String colorTag;

    @Column(name = "sidebar_order")
    private Integer sidebarOrder = 0;

    @Column(name = "show_in_sidebar")
    private Boolean showInSidebar = true;

    public Team() {}

    public Team(String name, String code, String description, String icon, String colorTag, Integer sidebarOrder) {
        this.name = name;
        this.code = code;
        this.description = description;
        this.icon = icon;
        this.colorTag = colorTag;
        this.sidebarOrder = sidebarOrder;
        this.showInSidebar = true;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getColorTag() {
        return colorTag;
    }

    public void setColorTag(String colorTag) {
        this.colorTag = colorTag;
    }

    public Integer getSidebarOrder() {
        return sidebarOrder;
    }

    public void setSidebarOrder(Integer sidebarOrder) {
        this.sidebarOrder = sidebarOrder;
    }

    public Boolean getShowInSidebar() {
        return showInSidebar;
    }

    public void setShowInSidebar(Boolean showInSidebar) {
        this.showInSidebar = showInSidebar;
    }
}
