package main

type UserProfile struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	Role       string `json:"role"`
	JoinedDate string `json:"joinedDate"`
}
