package main

import (
	"context"
	"log"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

var allowedOrigins = map[string]bool{
	"https://mcp-mvp.bkawk.com": true,
}

func handler(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	origin := request.Headers["origin"]

	if request.RequestContext.HTTP.Method == "OPTIONS" {
		return corsResponse(events.APIGatewayV2HTTPResponse{StatusCode: 204}, origin), nil
	}

	var resp events.APIGatewayV2HTTPResponse
	var err error

	method := request.RequestContext.HTTP.Method
	path := request.RawPath

	switch {
	case method == "GET" && path == "/users":
		resp, err = handleListUsers()
	case method == "GET" && strings.HasPrefix(path, "/users/"):
		userID := strings.TrimPrefix(path, "/users/")
		resp, err = handleGetUser(userID)
	default:
		resp, _ = jsonResp(404, map[string]string{"error": "not found"})
	}

	if err != nil {
		log.Printf("handler error on %s %s: %v", method, path, err)
		return corsResponse(events.APIGatewayV2HTTPResponse{StatusCode: 500}, origin), nil
	}

	return corsResponse(resp, origin), nil
}

func corsResponse(resp events.APIGatewayV2HTTPResponse, origin string) events.APIGatewayV2HTTPResponse {
	if resp.Headers == nil {
		resp.Headers = make(map[string]string)
	}
	if allowedOrigins[origin] {
		resp.Headers["Access-Control-Allow-Origin"] = origin
		resp.Headers["Access-Control-Allow-Methods"] = "GET,OPTIONS"
		resp.Headers["Access-Control-Allow-Headers"] = "Content-Type"
		resp.Headers["Vary"] = "Origin"
	}
	resp.Headers["X-Content-Type-Options"] = "nosniff"
	resp.Headers["Content-Security-Policy"] = "default-src 'none'"
	return resp
}

func main() {
	lambda.Start(handler)
}
