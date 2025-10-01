import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  User,
  UserCreate,
  UserLogin,
  TokenResponse,
  UserRole,
  Dataset,
  DatasetCreate,
  DatasetVersion,
  DatasetColumn,
  Rule,
  RuleCreate,
  RuleUpdate,
  Execution,
  ExecutionCreate,
  Issue,
  PaginatedResponse,
  DataProfileResponse,
  RuleTestRequest,
  DashboardOverview,
  DataQualitySummary,
  ExecutionSummary,
  Export,
  ExportCreate,
  Fix,
  FixCreate,
} from "@/types/api";
import { getApiUrl } from "./config";

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = getApiUrl()) {
    // Ensure HTTPS in production
    const secureURL = baseURL.startsWith('http://') && baseURL.includes('fly.dev')
      ? baseURL.replace('http://', 'https://')
      : baseURL;

    console.log('🔧 ApiClient created with baseURL:', secureURL, 'NODE_ENV:', process.env.NODE_ENV);
    this.client = axios.create({
      baseURL: secureURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        // Debug: Log the actual URL being requested
        const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
        console.log('🌐 Axios request:', fullUrl);

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.token = null;
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token");
          }
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage on initialization (client-side only)
    if (typeof window !== "undefined") {
      try {
        this.token = localStorage.getItem("auth_token");
      } catch (error) {
        console.warn("Failed to load token from localStorage:", error);
        this.token = null;
      }
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  getToken() {
    return this.token;
  }

  // Auth endpoints
  async login(credentials: UserLogin): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>(
      "/auth/login",
      credentials
    );
    this.setToken(response.data.access_token);
    return response.data;
  }

  async register(userData: UserCreate): Promise<User> {
    const response = await this.client.post<User>("/auth/register", userData);
    return response.data;
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>("/auth/me");
    return response.data;
  }

  // Dataset endpoints
  async getDatasets(): Promise<PaginatedResponse<Dataset>> {
    const response = await this.client.get<Dataset[]>("/data/datasets");
    // Convert the array response to paginated format for consistency
    const datasets = Array.isArray(response.data) ? response.data : [];
    return {
      items: datasets,
      total: datasets.length,
      page: 1,
      size: datasets.length,
      pages: 1,
    };
  }

  async getDataset(id: string): Promise<Dataset> {
    const response = await this.client.get<Dataset>(`/data/datasets/${id}`);
    return response.data;
  }

  async createDataset(dataset: DatasetCreate): Promise<Dataset> {
    const response = await this.client.post<Dataset>("/data/datasets", dataset);
    return response.data;
  }

  async updateDataset(
    id: string,
    dataset: Partial<DatasetCreate>
  ): Promise<Dataset> {
    const response = await this.client.put<Dataset>(
      `/data/datasets/${id}`,
      dataset
    );
    return response.data;
  }

  async deleteDataset(id: string): Promise<void> {
    await this.client.delete(`/data/datasets/${id}`);
  }

  async uploadFile(
    file: File,
    datasetName: string,
    description?: string
  ): Promise<{
    message: string;
    filename: string;
    size: number;
    dataset_id: string;
  }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dataset_name", datasetName);
    if (description) {
      formData.append("description", description);
    }

    const response = await this.client.post<{
      message: string;
      filename: string;
      size: number;
      dataset_id: string;
    }>("/data/upload/file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  async getDataProfile(datasetId: string): Promise<DataProfileResponse> {
    const response = await this.client.get<DataProfileResponse>(
      `/data/datasets/${datasetId}/profile`
    );
    return response.data;
  }

  // Dataset versions
  async getDatasetVersions(datasetId: string): Promise<DatasetVersion[]> {
    const response = await this.client.get<DatasetVersion[]>(
      `/datasets/${datasetId}/versions`
    );
    return response.data;
  }

  async getDatasetVersion(
    datasetId: string,
    versionId: string
  ): Promise<DatasetVersion> {
    const response = await this.client.get<DatasetVersion>(
      `/datasets/${datasetId}/versions/${versionId}`
    );
    return response.data;
  }

  // Dataset columns
  async getDatasetColumns(datasetId: string): Promise<DatasetColumn[]> {
    const response = await this.client.get<DatasetColumn[]>(
      `/data/datasets/${datasetId}/columns`
    );
    return response.data;
  }

  // Rule endpoints
  async getRules(): Promise<PaginatedResponse<Rule>> {
    const response = await this.client.get<Rule[]>("/rules", {
      params: {
        active_only: false, // Get all rules, not just active ones
      },
    });
    // Convert the array response to paginated format for consistency
    const rules = Array.isArray(response.data) ? response.data : [];
    return {
      items: rules,
      total: rules.length,
      page: 1,
      size: rules.length,
      pages: 1,
    };
  }

  async getRule(id: string): Promise<Rule> {
    const response = await this.client.get<Rule>(`/rules/${id}`);
    return response.data;
  }

  async createRule(rule: RuleCreate): Promise<Rule> {
    const response = await this.client.post<Rule>("/rules", rule);
    return response.data;
  }

  async updateRule(id: string, rule: RuleUpdate): Promise<Rule> {
    const response = await this.client.put<Rule>(`/rules/${id}`, rule);
    return response.data;
  }

  async deleteRule(id: string): Promise<void> {
    await this.client.delete(`/rules/${id}`);
  }

  async testRule(
    ruleId: string,
    testData: RuleTestRequest
  ): Promise<{ success: boolean; message: string; results?: unknown }> {
    const response = await this.client.post(`/rules/${ruleId}/test`, testData);
    return response.data;
  }

  async getRuleKinds(): Promise<
    { kind: string; description: string; parameters: unknown }[]
  > {
    const response = await this.client.get("/rules/kinds/available");
    return response.data;
  }

  async activateRule(id: string): Promise<void> {
    await this.client.patch(`/rules/${id}/activate`);
  }

  async deactivateRule(id: string): Promise<void> {
    await this.client.patch(`/rules/${id}/deactivate`);
  }

  // Execution endpoints
  async getExecutions(
    page: number = 1,
    size: number = 20
  ): Promise<PaginatedResponse<Execution>> {
    const response = await this.client.get<PaginatedResponse<Execution>>(
      "/executions",
      {
        params: { page, size },
      }
    );
    return response.data;
  }

  async getExecution(id: string): Promise<Execution> {
    const response = await this.client.get<Execution>(`/executions/${id}`);
    return response.data;
  }

  async createExecution(execution: ExecutionCreate): Promise<Execution> {
    const response = await this.client.post<Execution>(
      "/executions",
      execution
    );
    return response.data;
  }

  async getExecutionSummary(id: string): Promise<ExecutionSummary> {
    const response = await this.client.get<ExecutionSummary>(
      `/executions/${id}/summary`
    );
    return response.data;
  }

  // Issue endpoints
  async getIssues(
    executionId?: string,
    page: number = 1,
    size: number = 20
  ): Promise<PaginatedResponse<Issue>> {
    const params: Record<string, unknown> = { page, size };
    if (executionId) params.execution_id = executionId;

    const response = await this.client.get<PaginatedResponse<Issue>>(
      "/issues",
      { params }
    );
    return response.data;
  }

  async getIssue(id: string): Promise<Issue> {
    const response = await this.client.get<Issue>(`/issues/${id}`);
    return response.data;
  }

  async resolveIssue(id: string): Promise<Issue> {
    const response = await this.client.post<Issue>(`/issues/${id}/resolve`);
    return response.data;
  }

  // Fix endpoints
  async createFix(fix: FixCreate): Promise<Fix> {
    const response = await this.client.post<Fix>("/fixes", fix);
    return response.data;
  }

  async getFixes(issueId: string): Promise<Fix[]> {
    const response = await this.client.get<Fix[]>(`/issues/${issueId}/fixes`);
    return response.data;
  }

  // Export endpoints
  async getExports(
    page: number = 1,
    size: number = 20
  ): Promise<PaginatedResponse<Export>> {
    const response = await this.client.get<PaginatedResponse<Export>>(
      "/exports",
      {
        params: { page, size },
      }
    );
    return response.data;
  }

  async createExport(exportData: ExportCreate): Promise<Export> {
    const response = await this.client.post<Export>("/exports", exportData);
    return response.data;
  }

  async downloadExport(id: string): Promise<Blob> {
    const response = await this.client.get(`/exports/${id}/download`, {
      responseType: "blob",
    });
    return response.data;
  }

  // Report endpoints
  async getDataQualitySummary(): Promise<DataQualitySummary> {
    const response = await this.client.get<DataQualitySummary>(
      "/reports/data-quality-summary"
    );
    return response.data;
  }

  async getExecutionReports(
    page: number = 1,
    size: number = 20
  ): Promise<PaginatedResponse<ExecutionSummary>> {
    const response = await this.client.get<PaginatedResponse<ExecutionSummary>>(
      "/reports/executions",
      {
        params: { page, size },
      }
    );
    return response.data;
  }

  // Dashboard endpoints
  async getDashboardOverview(): Promise<DashboardOverview> {
    const response = await this.client.get<DashboardOverview>(
      "/reports/dashboard/overview"
    );
    return response.data;
  }

  // User management endpoints (admin only)
  async getUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>("/auth/users");
    return response.data;
  }

  async updateUserRole(
    userId: string,
    role: UserRole
  ): Promise<{ message: string; user: User }> {
    const response = await this.client.put<{ message: string; user: User }>(
      `/auth/users/${userId}/role`,
      { role }
    );
    return response.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.client.delete(`/auth/users/${userId}`);
  }

  async createUser(userData: UserCreate): Promise<User> {
    const response = await this.client.post<User>("/auth/register", userData);
    return response.data;
  }

  // Generic HTTP methods for direct API access
  async get<T = unknown>(
    url: string,
    config?: Record<string, unknown>
  ): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = unknown>(
    url: string,
    config?: Record<string, unknown>
  ): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
}

// Singleton instance - recreate on client-side to ensure correct URL
let instance: ApiClient | null = null;
let lastUrl: string | null = null;

function getInstance(): ApiClient {
  const currentUrl = getApiUrl();

  // Recreate instance if URL changed or doesn't exist
  if (!instance || lastUrl !== currentUrl) {
    console.log('🔄 Creating new ApiClient instance with URL:', currentUrl);
    instance = new ApiClient(currentUrl);
    lastUrl = currentUrl;
  }

  return instance;
}

// Export proxy for lazy initialization
const apiClient = new Proxy({} as ApiClient, {
  get(_target, prop: string) {
    const inst = getInstance();
    const value = inst[prop as keyof ApiClient];
    return typeof value === 'function' ? value.bind(inst) : value;
  }
});

export default apiClient;
export { ApiClient };
