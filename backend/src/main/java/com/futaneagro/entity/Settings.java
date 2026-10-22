package com.futaneagro.entity;

import javax.persistence.*;

/**
 * <h1>Settings Entity (Global System Configuration Key-Value Store)</h1>
 * <p>
 * Maps to table {@code t_sys_settings}. Stores dynamic runtime platform properties,
 * backup configurations, SMS/WhatsApp gateway credentials, and system operational flags.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_sys_settings")
public class Settings extends BaseEntity {
    private String configKey;

    @Column(name = "config_value", columnDefinition = "TEXT")
    private String configValue;

    public Settings() {}

    public Settings(String configKey, String configValue) {
        this.configKey = configKey;
        this.configValue = configValue;
    }

    public String getConfigKey() {
        return configKey;
    }

    public void setConfigKey(String configKey) {
        this.configKey = configKey;
    }

    public String getConfigValue() {
        return configValue;
    }

    public void setConfigValue(String configValue) {
        this.configValue = configValue;
    }
}
