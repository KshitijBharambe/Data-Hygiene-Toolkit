import pandas as pd
import numpy as np
import re
import datetime
from typing import Dict, List, Any, Optional, Tuple, Union
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models import (
    Dataset, DatasetVersion, DatasetColumn, Issue, Fix, Execution,
    DatasetStatus, User, SourceType
)
from app.schemas import FixCreate, FixResponse
from app.services.data_import import DataImportService


class DataQualityService:
    """
    Service for comprehensive data quality operations including:
    - Missing data handling
    - Data standardization
    - Value validation
    - Data correction workflows
    """

    def __init__(self, db: Session):
        self.db = db
        self.data_import_service = DataImportService(db)

    # === MISSING DATA HANDLING ===

    def handle_missing_data(
        self,
        df: pd.DataFrame,
        strategy: str = "smart",
        column_strategies: Optional[Dict[str, str]] = None
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Handle missing data with various strategies

        Args:
            df: DataFrame to process
            strategy: Global strategy ('drop', 'mean', 'median', 'mode', 'forward_fill', 'smart')
            column_strategies: Column-specific strategies override

        Returns:
            Tuple of (cleaned_df, report)
        """
        cleaned_df = df.copy()
        report = {
            "original_missing_count": {k: int(v) for k, v in df.isnull().sum().to_dict().items()},
            "actions_taken": {},
            "final_missing_count": {},
            "rows_dropped": 0
        }

        # Apply column-specific strategies first
        if column_strategies:
            for column, col_strategy in column_strategies.items():
                if column in cleaned_df.columns:
                    cleaned_df, action = self._apply_missing_strategy(
                        cleaned_df, column, col_strategy
                    )
                    report["actions_taken"][column] = action

        # Apply global strategy to remaining columns with missing data
        for column in cleaned_df.columns:
            if column not in (column_strategies or {}) and cleaned_df[column].isnull().any():
                cleaned_df, action = self._apply_missing_strategy(
                    cleaned_df, column, strategy
                )
                if column not in report["actions_taken"]:
                    report["actions_taken"][column] = action

        report["final_missing_count"] = {k: int(v) for k, v in cleaned_df.isnull().sum().to_dict().items()}
        report["rows_dropped"] = len(df) - len(cleaned_df)

        return cleaned_df, report

    def _apply_missing_strategy(
        self,
        df: pd.DataFrame,
        column: str,
        strategy: str
    ) -> Tuple[pd.DataFrame, str]:
        """Apply specific missing data strategy to a column"""

        if strategy == "drop":
            original_len = len(df)
            df = df.dropna(subset=[column])
            return df, f"Dropped {original_len - len(df)} rows with missing values"

        elif strategy == "mean" and df[column].dtype in ['int64', 'float64']:
            mean_val = df[column].mean()
            df[column] = df[column].fillna(mean_val)
            return df, f"Filled with mean value: {mean_val:.2f}"

        elif strategy == "median" and df[column].dtype in ['int64', 'float64']:
            median_val = df[column].median()
            df[column] = df[column].fillna(median_val)
            return df, f"Filled with median value: {median_val:.2f}"

        elif strategy == "mode":
            mode_val = df[column].mode()
            if not mode_val.empty:
                df[column] = df[column].fillna(mode_val.iloc[0])
                return df, f"Filled with mode value: {mode_val.iloc[0]}"

        elif strategy == "forward_fill":
            df[column] = df[column].fillna(method='ffill')
            return df, "Forward filled missing values"

        elif strategy == "smart":
            # Smart strategy: choose best method based on data type and distribution
            if df[column].dtype in ['int64', 'float64']:
                # For numeric: use median if skewed, mean if normal
                if abs(df[column].skew()) > 1:
                    return self._apply_missing_strategy(df, column, "median")
                else:
                    return self._apply_missing_strategy(df, column, "mean")
            else:
                # For categorical: use mode
                return self._apply_missing_strategy(df, column, "mode")

        return df, "No action taken"

    # === DATA STANDARDIZATION ===

    def standardize_data(
        self,
        df: pd.DataFrame,
        standardization_rules: Dict[str, str]
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Standardize data formats across columns

        Args:
            df: DataFrame to standardize
            standardization_rules: Dict mapping column names to standardization types
                                 ('date', 'phone', 'email', 'address', 'name', 'currency')

        Returns:
            Tuple of (standardized_df, report)
        """
        standardized_df = df.copy()
        report = {
            "columns_processed": [],
            "standardization_actions": {},
            "errors": {}
        }

        for column, rule_type in standardization_rules.items():
            if column not in standardized_df.columns:
                report["errors"][column] = f"Column not found in dataset"
                continue

            try:
                if rule_type == "date":
                    standardized_df[column], action = self._standardize_dates(
                        standardized_df[column]
                    )
                elif rule_type == "phone":
                    standardized_df[column], action = self._standardize_phones(
                        standardized_df[column]
                    )
                elif rule_type == "email":
                    standardized_df[column], action = self._standardize_emails(
                        standardized_df[column]
                    )
                elif rule_type == "address":
                    standardized_df[column], action = self._standardize_addresses(
                        standardized_df[column]
                    )
                elif rule_type == "name":
                    standardized_df[column], action = self._standardize_names(
                        standardized_df[column]
                    )
                elif rule_type == "currency":
                    standardized_df[column], action = self._standardize_currency(
                        standardized_df[column]
                    )
                else:
                    action = f"Unknown standardization type: {rule_type}"

                report["columns_processed"].append(column)
                report["standardization_actions"][column] = action

            except Exception as e:
                report["errors"][column] = str(e)

        return standardized_df, report

    def _standardize_dates(self, series: pd.Series) -> Tuple[pd.Series, str]:
        """Standardize date formats to ISO 8601 (YYYY-MM-DD)"""
        original_count = len(series.dropna())

        # Try multiple date formats
        date_formats = [
            '%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y',
            '%Y/%m/%d', '%d.%m.%Y', '%Y.%m.%d'
        ]

        standardized = pd.to_datetime(series, errors='coerce', infer_datetime_format=True)
        standardized = standardized.dt.strftime('%Y-%m-%d')

        successful_count = len(standardized.dropna())
        return standardized, f"Standardized {successful_count}/{original_count} dates to ISO format"

    def _standardize_phones(self, series: pd.Series) -> Tuple[pd.Series, str]:
        """Standardize phone numbers to international format"""
        def clean_phone(phone_str):
            if pd.isna(phone_str):
                return phone_str

            # Remove all non-numeric characters except +
            cleaned = re.sub(r'[^\d+]', '', str(phone_str))

            # Add country code if missing (assuming US for demo)
            if not cleaned.startswith('+'):
                if len(cleaned) == 10:
                    cleaned = '+1' + cleaned
                elif len(cleaned) == 11 and cleaned.startswith('1'):
                    cleaned = '+' + cleaned

            return cleaned

        standardized = series.apply(clean_phone)
        return standardized, f"Standardized phone numbers to international format"

    def _standardize_emails(self, series: pd.Series) -> Tuple[pd.Series, str]:
        """Standardize email addresses"""
        def clean_email(email_str):
            if pd.isna(email_str):
                return email_str

            # Convert to lowercase and strip whitespace
            cleaned = str(email_str).lower().strip()

            # Basic email validation
            if re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', cleaned):
                return cleaned

            return None  # Invalid email

        standardized = series.apply(clean_email)
        return standardized, f"Standardized email addresses to lowercase"

    def _standardize_addresses(self, series: pd.Series) -> Tuple[pd.Series, str]:
        """Standardize address formats"""
        def clean_address(addr_str):
            if pd.isna(addr_str):
                return addr_str

            # Title case and basic cleanup
            cleaned = str(addr_str).title().strip()

            # Common abbreviations
            abbreviations = {
                ' Street': ' St', ' Avenue': ' Ave', ' Boulevard': ' Blvd',
                ' Drive': ' Dr', ' Road': ' Rd', ' Lane': ' Ln'
            }

            for full, abbrev in abbreviations.items():
                cleaned = cleaned.replace(full, abbrev)

            return cleaned

        standardized = series.apply(clean_address)
        return standardized, f"Standardized address formats with common abbreviations"

    def _standardize_names(self, series: pd.Series) -> Tuple[pd.Series, str]:
        """Standardize person names"""
        def clean_name(name_str):
            if pd.isna(name_str):
                return name_str

            # Title case and remove extra whitespace
            cleaned = ' '.join(str(name_str).title().split())
            return cleaned

        standardized = series.apply(clean_name)
        return standardized, f"Standardized names to title case"

    def _standardize_currency(self, series: pd.Series) -> Tuple[pd.Series, str]:
        """Standardize currency values"""
        def clean_currency(curr_str):
            if pd.isna(curr_str):
                return curr_str

            # Remove currency symbols and convert to float
            cleaned = re.sub(r'[^\d.-]', '', str(curr_str))
            try:
                return float(cleaned)
            except ValueError:
                return None

        standardized = series.apply(clean_currency)
        return standardized, f"Standardized currency to numeric format"

    # === VALUE VALIDATION ===

    def validate_values(
        self,
        df: pd.DataFrame,
        validation_rules: Dict[str, Dict[str, Any]]
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Validate values against business rules

        Args:
            df: DataFrame to validate
            validation_rules: Dict with column names as keys, validation configs as values
                            Example: {
                                'iban': {'type': 'iban'},
                                'country': {'type': 'country_code'},
                                'postal_code': {'type': 'postal_code', 'country': 'US'}
                            }

        Returns:
            Tuple of (validated_df, validation_report)
        """
        validated_df = df.copy()
        report = {
            "columns_validated": [],
            "validation_results": {},
            "errors": {}
        }

        for column, validation_config in validation_rules.items():
            if column not in validated_df.columns:
                report["errors"][column] = "Column not found in dataset"
                continue

            try:
                validation_type = validation_config.get('type')

                if validation_type == 'iban':
                    result = self._validate_iban(validated_df[column])
                elif validation_type == 'country_code':
                    result = self._validate_country_codes(validated_df[column])
                elif validation_type == 'postal_code':
                    country = validation_config.get('country', 'US')
                    result = self._validate_postal_codes(validated_df[column], country)
                elif validation_type == 'length_range':
                    min_len = validation_config.get('min_length', 0)
                    max_len = validation_config.get('max_length', float('inf'))
                    result = self._validate_length_range(validated_df[column], min_len, max_len)
                elif validation_type == 'regex':
                    pattern = validation_config.get('pattern')
                    result = self._validate_regex_pattern(validated_df[column], pattern)
                else:
                    result = {"valid_count": 0, "invalid_count": 0, "message": f"Unknown validation type: {validation_type}"}

                report["columns_validated"].append(column)
                report["validation_results"][column] = result

            except Exception as e:
                report["errors"][column] = str(e)

        return validated_df, report

    def _validate_iban(self, series: pd.Series) -> Dict[str, Any]:
        """Validate IBAN format (simplified)"""
        def is_valid_iban(iban_str):
            if pd.isna(iban_str):
                return False

            # Basic IBAN validation (country code + 2 check digits + account identifier)
            iban = str(iban_str).replace(' ', '').upper()
            return len(iban) >= 15 and len(iban) <= 34 and iban[:2].isalpha() and iban[2:4].isdigit()

        valid_mask = series.apply(is_valid_iban)
        return {
            "valid_count": int(valid_mask.sum()),
            "invalid_count": int((~valid_mask).sum()),
            "message": "IBAN format validation completed"
        }

    def _validate_country_codes(self, series: pd.Series) -> Dict[str, Any]:
        """Validate ISO country codes"""
        # Common ISO 3166-1 alpha-2 country codes (subset)
        valid_codes = {
            'US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT',
            'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'PL', 'CZ',
            'AU', 'NZ', 'JP', 'KR', 'CN', 'IN', 'BR', 'MX', 'AR', 'CL'
        }

        def is_valid_country(country_str):
            if pd.isna(country_str):
                return False
            return str(country_str).upper() in valid_codes

        valid_mask = series.apply(is_valid_country)
        return {
            "valid_count": int(valid_mask.sum()),
            "invalid_count": int((~valid_mask).sum()),
            "message": "Country code validation completed"
        }

    def _validate_postal_codes(self, series: pd.Series, country: str = 'US') -> Dict[str, Any]:
        """Validate postal codes for specific countries"""
        patterns = {
            'US': r'^\d{5}(-\d{4})?$',
            'CA': r'^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$',
            'GB': r'^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][A-BD-HJLNP-UW-Z]{2}$',
            'DE': r'^\d{5}$',
            'FR': r'^\d{5}$'
        }

        pattern = patterns.get(country.upper(), patterns['US'])

        def is_valid_postal(postal_str):
            if pd.isna(postal_str):
                return False
            return bool(re.match(pattern, str(postal_str).strip()))

        valid_mask = series.apply(is_valid_postal)
        return {
            "valid_count": int(valid_mask.sum()),
            "invalid_count": int((~valid_mask).sum()),
            "message": f"Postal code validation for {country} completed"
        }

    def _validate_length_range(self, series: pd.Series, min_len: int, max_len: int) -> Dict[str, Any]:
        """Validate string length ranges"""
        def is_valid_length(value):
            if pd.isna(value):
                return False
            length = len(str(value))
            return min_len <= length <= max_len

        valid_mask = series.apply(is_valid_length)
        return {
            "valid_count": int(valid_mask.sum()),
            "invalid_count": int((~valid_mask).sum()),
            "message": f"Length validation (min: {min_len}, max: {max_len}) completed"
        }

    def _validate_regex_pattern(self, series: pd.Series, pattern: str) -> Dict[str, Any]:
        """Validate values against regex pattern"""
        def matches_pattern(value):
            if pd.isna(value):
                return False
            return bool(re.match(pattern, str(value)))

        valid_mask = series.apply(matches_pattern)
        return {
            "valid_count": int(valid_mask.sum()),
            "invalid_count": int((~valid_mask).sum()),
            "message": f"Regex pattern validation completed"
        }

    # === DATA CORRECTION WORKFLOWS ===

    def apply_corrections(
        self,
        dataset_id: str,
        corrections: List[Dict[str, Any]],
        user_id: str
    ) -> Dict[str, Any]:
        """
        Apply manual corrections to dataset

        Args:
            dataset_id: Dataset to correct
            corrections: List of correction dicts with row_index, column, new_value
            user_id: User applying corrections

        Returns:
            Correction report
        """
        # Load the current dataset
        dataset = self.db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )

        # Get the latest version
        latest_version = (
            self.db.query(DatasetVersion)
            .filter(DatasetVersion.dataset_id == dataset_id)
            .order_by(DatasetVersion.version_number.desc())
            .first()
        )

        if not latest_version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No dataset version found"
            )

        # Load the dataframe
        df = self.data_import_service.load_dataset_file(dataset_id, latest_version.version_number)

        corrections_applied = 0
        errors = []

        for correction in corrections:
            try:
                row_index = correction.get('row_index')
                column = correction.get('column')
                new_value = correction.get('new_value')
                issue_id = correction.get('issue_id')  # Optional reference to specific issue

                if row_index is not None and column in df.columns:
                    old_value = df.at[row_index, column]
                    df.at[row_index, column] = new_value
                    corrections_applied += 1

                    # Create fix record if issue_id is provided
                    if issue_id:
                        fix = Fix(
                            issue_id=issue_id,
                            fixed_by=user_id,
                            new_value=str(new_value),
                            comment=f"Manual correction: {old_value} -> {new_value}"
                        )
                        self.db.add(fix)

            except Exception as e:
                errors.append(f"Failed to apply correction {correction}: {str(e)}")

        # Save the corrected dataset as a new version
        if corrections_applied > 0:
            new_version_number = latest_version.version_number + 1
            file_path = self.data_import_service.save_dataset_file(
                dataset_id, df, new_version_number
            )

            # Create new dataset version record
            new_version = DatasetVersion(
                dataset_id=dataset_id,
                version_number=new_version_number,
                file_path=file_path,
                row_count=len(df),
                column_count=len(df.columns),
                notes=f"Applied {corrections_applied} manual corrections"
            )
            self.db.add(new_version)
            self.db.commit()

        return {
            "corrections_applied": corrections_applied,
            "errors": errors,
            "new_version_number": new_version_number if corrections_applied > 0 else None
        }

    def create_data_quality_summary(self, dataset_id: str) -> Dict[str, Any]:
        """Generate comprehensive data quality summary for a dataset"""

        # Get dataset and latest version
        dataset = self.db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )

        latest_version = (
            self.db.query(DatasetVersion)
            .filter(DatasetVersion.dataset_id == dataset_id)
            .order_by(DatasetVersion.version_number.desc())
            .first()
        )

        # Load the dataframe for analysis
        df = self.data_import_service.load_dataset_file(dataset_id, latest_version.version_number)

        # Get execution history and issues
        executions = (
            self.db.query(Execution)
            .filter(Execution.dataset_version_id == latest_version.id)
            .all()
        )

        total_issues = sum(exec.issues_found for exec in executions if exec.issues_found)
        total_fixes = (
            self.db.query(Fix)
            .join(Issue)
            .filter(Issue.execution_id.in_([e.id for e in executions]))
            .count()
        )

        # Basic data quality metrics
        quality_score = self._calculate_quality_score(df)

        return {
            "dataset_id": dataset_id,
            "dataset_name": dataset.name,
            "current_version": latest_version.version_number,
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "missing_data_percentage": float((df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100),
            "duplicate_rows": int(df.duplicated().sum()),
            "total_issues_found": total_issues,
            "total_fixes_applied": total_fixes,
            "data_quality_score": quality_score,
            "column_quality": self._analyze_column_quality(df),
            "execution_summary": {
                "total_executions": len(executions),
                "last_execution": executions[-1].created_at if executions else None,
                "success_rate": len([e for e in executions if e.status == "succeeded"]) / len(executions) * 100 if executions else 0
            }
        }

    def _calculate_quality_score(self, df: pd.DataFrame) -> float:
        """Calculate overall data quality score (0-100)"""
        factors = []

        # Completeness (no missing data)
        completeness = (1 - df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
        factors.append(completeness)

        # Uniqueness (no duplicate rows)
        uniqueness = (1 - df.duplicated().sum() / len(df)) * 100 if len(df) > 0 else 100
        factors.append(uniqueness)

        # Consistency (uniform data types per column)
        consistency_scores = []
        for column in df.columns:
            non_null_values = df[column].dropna()
            if len(non_null_values) > 0:
                # Check if values are consistent with inferred type
                try:
                    if df[column].dtype == 'object':
                        # For object columns, check if they can be consistently parsed
                        pd.to_numeric(non_null_values, errors='raise')
                        consistency_scores.append(100)
                    else:
                        consistency_scores.append(100)
                except:
                    consistency_scores.append(90)  # Some inconsistency detected
            else:
                consistency_scores.append(0)

        consistency = float(np.mean(consistency_scores)) if consistency_scores else 100
        factors.append(consistency)

        # Overall score is weighted average
        return float(np.mean(factors))

    def _analyze_column_quality(self, df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
        """Analyze quality metrics for each column"""
        column_analysis = {}

        for column in df.columns:
            series = df[column]
            analysis = {
                "data_type": str(series.dtype),
                "missing_count": int(series.isnull().sum()),
                "missing_percentage": float((series.isnull().sum() / len(series)) * 100),
                "unique_values": int(series.nunique()),
                "duplicate_count": int(len(series) - series.nunique()),
            }

            # Type-specific analysis
            if series.dtype in ['int64', 'float64']:
                analysis.update({
                    "min_value": float(series.min()) if not pd.isna(series.min()) else None,
                    "max_value": float(series.max()) if not pd.isna(series.max()) else None,
                    "mean_value": float(series.mean()) if not pd.isna(series.mean()) else None,
                    "outliers_count": int(self._count_outliers(series))
                })
            elif series.dtype == 'object':
                analysis.update({
                    "avg_length": float(series.astype(str).str.len().mean()),
                    "min_length": int(series.astype(str).str.len().min()),
                    "max_length": int(series.astype(str).str.len().max()),
                })

            column_analysis[column] = analysis

        return column_analysis

    def _count_outliers(self, series: pd.Series) -> int:
        """Count outliers using IQR method"""
        try:
            Q1 = series.quantile(0.25)
            Q3 = series.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            outliers = series[(series < lower_bound) | (series > upper_bound)]
            return len(outliers)
        except:
            return 0