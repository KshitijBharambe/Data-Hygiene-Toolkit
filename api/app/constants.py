"""
Application-wide constants for the Data Hygiene Toolkit
"""

# Criticality weights for DQI calculation
# Used to weight rule importance in data quality metrics
CRITICALITY_WEIGHTS = {
    "low": 1,
    "medium": 2,
    "high": 3,
    "critical": 5
}

# Metric status values
METRIC_STATUS_OK = "ok"
METRIC_STATUS_NOT_AVAILABLE = "not_available"

# Default messages
METRIC_NO_EXECUTION_MESSAGE = "Run an execution to calculate data quality"
