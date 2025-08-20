package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sync/atomic"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

/******** config ********/
var (
	Version = "0.1.0" // set via -ldflags if you want
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

// metrics
var (
	httpReqs = prometheus.NewCounterVec(
		prometheus.CounterOpts{Name: "rapp_http_requests_total", Help: "HTTP requests by path & code"},
		[]string{"path", "code"},
	)
	a1Puts = prometheus.NewCounterVec(
		prometheus.CounterOpts{Name: "rapp_a1_put_total", Help: "A1 PUT calls to PMS by resource"},
		[]string{"resource", "status"},
	)
	policyLimit = prometheus.NewGauge(
		prometheus.GaugeOpts{Name: "rapp_policy_limit", Help: "Current policy_data.limit the rApp last attempted"},
	)
	readyFlag atomic.Bool
)

func init() {
	prometheus.MustRegister(httpReqs, a1Puts, policyLimit)
}

func putJSON(url string, body any) (int, error) {
	b, _ := json.Marshal(body)
	req, _ := http.NewRequest(http.MethodPut, url, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, resp.Body)
	return resp.StatusCode, nil
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

	// health
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"ok":true}`))
		httpReqs.WithLabelValues("/healthz", "200").Inc()
	})
	mux.HandleFunc("/readyz", func(w http.ResponseWriter, r *http.Request) {
		if readyFlag.Load() {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("ready"))
			httpReqs.WithLabelValues("/readyz", "200").Inc()
			return
		}
		w.WriteHeader(http.StatusServiceUnavailable)
		w.Write([]byte("not-ready"))
		httpReqs.WithLabelValues("/readyz", "503").Inc()
	})
	mux.HandleFunc("/version", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(Version))
		httpReqs.WithLabelValues("/version", "200").Inc()
	})
	// metrics
	mux.Handle("/metrics", promhttp.Handler())

	// callback
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		log.Printf("CALLBACK %s %s", r.URL.Path, string(body))
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"ok":true}`))
		httpReqs.WithLabelValues("/callback", "200").Inc()
	})

	// startup
	go func() {
		register := func() error {
			code, err := putJSON(pmsURL+"/a1-policy/v2/services",
				RegisterBody{ServiceID: service, KeepAliveIntervalSeconds: keep, CallbackURL: cbURL})
			if err != nil {
				return err
			}
			a1Puts.WithLabelValues("services", fmt.Sprint(code)).Inc()
			log.Printf("PUT %s -> %d", "/a1-policy/v2/services", code)
			if code >= 300 {
				return fmt.Errorf("services code=%d", code)
			}
			return nil
		}
		putPolicy := func(limit float64) error {
			policyLimit.Set(limit)
			pol := PolicyBody{
				PolicyID:              policyID,
				RicID:                 ricID,
				PolicyTypeID:          ptypeID,
				ServiceID:             service,
				StatusNotificationURI: cbURL,
				PolicyData:            map[string]any{"note": "hello-from-go-rapp", "limit": limit},
			}
			code, err := putJSON(pmsURL+"/a1-policy/v2/policies", pol)
			if err != nil {
				return err
			}
			a1Puts.WithLabelValues("policies", fmt.Sprint(code)).Inc()
			log.Printf("PUT %s -> %d", "/a1-policy/v2/policies", code)
			if code >= 300 {
				return fmt.Errorf("policies code=%d", code)
			}
			return nil
		}

		// retry
		limit := 21.0
		for {
			if err := register(); err != nil {
				log.Printf("register service failed, retrying in 1s: %v", err)
				time.Sleep(1 * time.Second)
				continue
			}
			if err := putPolicy(limit); err != nil {
				log.Printf("put policy failed, retrying in 1s: %v", err)
				time.Sleep(1 * time.Second)
				continue
			}
			readyFlag.Store(true)
			break
		}

		// keepalive
		t := time.NewTicker(5 * time.Minute)
		for range t.C {
			if err := register(); err != nil {
				log.Printf("keepalive failed: %v", err)
			}
		}
	}()

	addr := ":8080"
	log.Printf("rApp starting on %s (service=%s ric=%s policy=%s)", addr, service, ricID, policyID)
	log.Fatal(http.ListenAndServe(addr, mux))
}
