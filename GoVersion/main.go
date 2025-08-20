package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

type RegisterBody struct {
	ServiceID                string `json:"service_id"`
	KeepAliveIntervalSeconds int    `json:"keep_alive_interval_seconds"`
	CallbackURL              string `json:"callback_url"`
}
type PolicyBody struct {
	PolicyID              string      `json:"policy_id"`
	RicID                 string      `json:"ric_id"`
	PolicyTypeID          string      `json:"policytype_id"`
	ServiceID             string      `json:"service_id"`
	StatusNotificationURI string      `json:"status_notification_uri"`
	PolicyData            interface{} `json:"policy_data"`
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

var httpClient = &http.Client{Timeout: 10 * time.Second}

func putJSON(url string, body any) (int, []byte, error) {
	b, _ := json.Marshal(body)
	req, _ := http.NewRequest(http.MethodPut, url, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	resp, err := httpClient.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return resp.StatusCode, data, fmt.Errorf("PUT %s -> %s: %s", url, resp.Status, string(data))
	}
	log.Printf("PUT %s -> %s", url, resp.Status)
	return resp.StatusCode, data, nil
}

func retryForever(label string, fn func() error) {
	backoff := time.Second
	for {
		if err := fn(); err == nil {
			return
		} else {
			log.Printf("%s failed, retrying in %s: %v", label, backoff, err)
		}
		time.Sleep(backoff)
		if backoff < 30*time.Second {
			backoff *= 2
		}
	}
}

func main() {
	// ENV
	pmsURL := getenv("PMS_URL", "http://policy-agent:8081")
	service := getenv("SERVICE_ID", "demo-rapp")
	ricID := getenv("RIC_ID", "ric2")
	policyID := getenv("POLICY_ID", "demo-policy-go")
	ptypeID := getenv("POLICY_TYPE_ID", "")
	cbURL := getenv("CALLBACK_URL", "http://demo-rapp:8080/callback")
	keep := 3600

	// HTTP server
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
	})
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		log.Printf("CALLBACK %s %s", r.URL.Path, string(body))
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK"))
	})

	// startup work with retries
	go func() {
		regBody := RegisterBody{ServiceID: service, KeepAliveIntervalSeconds: keep, CallbackURL: cbURL}
		retryForever("register service", func() error {
			_, _, err := putJSON(pmsURL+"/a1-policy/v2/services", regBody)
			return err
		})

		pol := PolicyBody{
			PolicyID:              policyID,
			RicID:                 ricID,
			PolicyTypeID:          ptypeID,
			ServiceID:             service,
			StatusNotificationURI: cbURL,
			PolicyData:            map[string]any{"note": "hello-from-go-rapp", "limit": 21},
		}
		retryForever("put policy", func() error {
			_, _, err := putJSON(pmsURL+"/a1-policy/v2/policies", pol)
			return err
		})

		// keepalive every 5 minutes
		t := time.NewTicker(5 * time.Minute)
		for range t.C {
			if _, _, err := putJSON(pmsURL+"/a1-policy/v2/services", regBody); err != nil {
				log.Printf("keepalive failed: %v", err)
			}
		}
	}()

	addr := ":8080"
	log.Printf("rApp starting on %s (service=%s ric=%s policy=%s)", addr, service, ricID, policyID)
	log.Fatal(http.ListenAndServe(addr, mux))
}
