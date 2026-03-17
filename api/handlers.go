package main

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

var users = map[string]UserProfile{
	"1": {
		ID:         "1",
		Name:       "Alice Johnson",
		Email:      "alice@example.com",
		Role:       "Engineer",
		JoinedDate: "2023-01-15",
	},
	"2": {
		ID:         "2",
		Name:       "Bob Smith",
		Email:      "bob@example.com",
		Role:       "Designer",
		JoinedDate: "2023-03-22",
	},
	"3": {
		ID:         "3",
		Name:       "Carol Williams",
		Email:      "carol@example.com",
		Role:       "Product Manager",
		JoinedDate: "2022-11-08",
	},
	"4": {
		ID:         "4",
		Name:       "Dave Brown",
		Email:      "dave@example.com",
		Role:       "DevOps",
		JoinedDate: "2024-06-01",
	},
	"5": {
		ID:         "5",
		Name:       "Eve Davis",
		Email:      "eve@example.com",
		Role:       "Data Scientist",
		JoinedDate: "2024-02-14",
	},
}

func handleGetUser(userID string) (events.APIGatewayV2HTTPResponse, error) {
	user, ok := users[userID]
	if !ok {
		return jsonResp(404, map[string]string{"error": "user not found"})
	}
	return jsonResp(200, user)
}

func handleListUsers() (events.APIGatewayV2HTTPResponse, error) {
	list := make([]UserProfile, 0, len(users))
	for _, u := range users {
		list = append(list, u)
	}
	return jsonResp(200, list)
}

func jsonResp(status int, body interface{}) (events.APIGatewayV2HTTPResponse, error) {
	b, err := json.Marshal(body)
	if err != nil {
		return events.APIGatewayV2HTTPResponse{StatusCode: 500}, err
	}
	return events.APIGatewayV2HTTPResponse{
		StatusCode: status,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       string(b),
	}, nil
}
