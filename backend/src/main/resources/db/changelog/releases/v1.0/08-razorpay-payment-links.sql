-- liquibase formatted sql
-- changeset admin:08-razorpay-payment-links

CREATE TABLE t_pay_payment_links (
    id CHAR(36) PRIMARY KEY,
    sale_id CHAR(36) NOT NULL,
    razorpay_payment_link_id VARCHAR(100) NOT NULL,
    razorpay_payment_id VARCHAR(100),
    short_url VARCHAR(500) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'CREATED',
    whatsapp_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_razorpay_link_id UNIQUE (razorpay_payment_link_id),
    CONSTRAINT uq_razorpay_payment_id UNIQUE (razorpay_payment_id)
);
