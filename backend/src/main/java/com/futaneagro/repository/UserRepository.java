package com.futaneagro.repository;

import com.futaneagro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    java.util.Optional<User> findByUsernameIgnoreCase(String username);
}

