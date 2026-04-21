import axios, { AxiosResponse, AxiosError } from 'axios'
import toast from 'react-hot-toast'

// ==================== Enums & Types ====================
export enum UserRole {
  ADMIN = 'admin',
  EXECUTOR = 'executor',
  CUSTOMER = 'customer',
  OPERATOR = 'operator'
}

export type TicketStatus = 'pending' | 'in_progress' | 'waiting' | 'done' | 'rejected';

// ==================== Interfaces ====================
export interface User {
  id: number
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Ticket {
  id: number
  title: string
  address: string
  description: string
  status: TicketStatus
  priority: number
  start_time?: string
  end_time?: string
  customer_id: number
  executor_id?: number
  created_at: string
  started_at?: string
  completed_at?: string
  completion_comment?: string
  rejection_reason?: string
  before_photo_path?: string
  after_photo_path?: string
  system?: string
  customer?: User
  executor?: User
  // Добавленные поля
  executor_name?: string
  executor_phone?: string
}

export interface LoginRequest {
  username: string // email
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface TicketCreate {
  title: string
  address: string
  description?: string
  start_time?: string
  end_time?: string
  priority: number
  executor_id?: number
  system?: string
  // Добавленные поля
  executor_name?: string
  executor_phone?: string
}

export interface DashboardData {
  stats: {
    total_tickets: number
    pending_tickets: number
    in_progress_tickets: number
    done_tickets: number
    rejected_tickets: number
    avg_completion_time_hours?: number
  }
  recent_tickets: Ticket[]
  my_tickets?: Ticket[]
}

export interface System {
  id: number
  name: string
  text_color: string
  bg_color: string
  border_color: string
  is_default: boolean
}

export interface Duty {
  id: number
  city: string
  employee_name: string
  employee_phone: string
  date: string
}

// ==================== Axios Instance ====================
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor – add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor – handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
      toast.error('Сессия истекла. Войдите в систему заново.')
    } else if (error.response?.status === 403) {
      toast.error('У вас нет прав для выполнения этого действия')
    } else if (error.response?.status && error.response.status >= 500) {
      toast.error('Ошибка сервера. Попробуйте позже.')
    } else if (!error.response) {
      toast.error('Ошибка сети. Проверьте подключение к интернету.')
    }
    return Promise.reject(error)
  }
)

// ==================== API Modules ====================
export const systemsAPI = {
  getAll: async (): Promise<System[]> => {
    const response = await api.get('/systems/')
    return response.data
  },
  create: async (data: Omit<System, 'id'>): Promise<System> => {
    const response = await api.post('/systems/', data)
    return response.data
  },
  update: async (id: number, data: Partial<Omit<System, 'id'>>): Promise<System> => {
    const response = await api.put(`/systems/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/systems/${id}`)
  },
}

export const dutiesAPI = {
  getByDate: async (date: string): Promise<Duty[]> => {
    const response = await api.get(`/duties/?date=${date}`)
    return response.data
  },
  getAll: async (): Promise<Duty[]> => {
    const response = await api.get('/duties/')
    return response.data
  },
  update: async (id: number, data: Partial<Duty>): Promise<Duty> => {
    const response = await api.put(`/duties/${id}`, data)
    return response.data
  },
  create: async (data: Omit<Duty, 'id'>): Promise<Duty> => {
    const response = await api.post('/duties/', data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/duties/${id}`)
  },
}

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const formData = new FormData()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  logout: () => {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/auth/users')
    return response.data
  },

  register: async (userData: any): Promise<User> => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  updateUserRole: async (userId: number, role: UserRole): Promise<User> => {
    const response = await api.put(`/auth/users/${userId}/role`, { role })
    return response.data
  },

  updateUser: async (userId: number, data: Partial<User> & { password?: string }): Promise<User> => {
    const response = await api.put(`/auth/users/${userId}`, data)
    return response.data
  },

  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/auth/users/${userId}`)
  },
}

export const ticketsAPI = {
  getAll: async (params?: {
    status?: string
    executor_id?: number
    limit?: number
    offset?: number
  }): Promise<Ticket[]> => {
    const response = await api.get('/tickets/', { params })
    return response.data
  },

  getById: async (id: number): Promise<Ticket> => {
    const response = await api.get(`/tickets/${id}`)
    return response.data
  },

  create: async (data: TicketCreate): Promise<Ticket> => {
    const response = await api.post('/tickets/', data)
    return response.data
  },

  update: async (id: number, data: FormData): Promise<Ticket> => {
    const response = await api.put(`/tickets/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tickets/${id}`)
  },

  getExecutors: async (): Promise<Array<{ id: number; full_name: string; email: string }>> => {
    const response = await api.get('/tickets/executors/list')
    return response.data
  },

  getDashboardData: async (): Promise<DashboardData> => {
    const response = await api.get('/tickets/dashboard/data')
    return response.data
  },

  bulkUpdateStatus: async (ids: number[], status: TicketStatus): Promise<void> => {
    await api.patch('/tickets/bulk-status', { ticket_ids: ids, status })
  },

  mergeTickets: async (ids: number[], title: string): Promise<Ticket> => {
    const response = await api.post('/tickets/merge', { ticket_ids: ids, title })
    return response.data
  },
}

export const reportsAPI = {
  downloadTicketReport: async (ticketId: number, format: 'pdf' | 'xlsx'): Promise<Blob> => {
    const response = await api.get(`/reports/${ticketId}`, {
      params: { format },
      responseType: 'blob',
    })
    return response.data
  },

  downloadDigestReport: async (range: 'daily' | 'weekly', format: 'pdf' | 'xlsx'): Promise<Blob> => {
    const response = await api.get(`/reports/digest/${range}`, {
      params: { format },
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Получить отчёт по выполненным заявкам
   */
  getExecutedReport: async (): Promise<Blob> => {
    const response = await api.get('/reports/executed', { responseType: 'blob' })
    return response.data
  },
}

// ==================== WebSocket Notifications ====================
export class NotificationSocket {
  private ws: WebSocket | null = null
  private userId: number | null = null
  private reconnectInterval: number = 5000
  private maxReconnectAttempts: number = 10
  private reconnectAttempts: number = 0

  connect(userId: number) {
    this.userId = userId
    this.reconnectAttempts = 0
    this.createConnection()
  }

  private createConnection() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${wsProtocol}//${window.location.host}/api/tickets/ws/${this.userId}`

      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('🔌 WebSocket соединение установлено')
        this.reconnectAttempts = 0

        setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send('ping')
          }
        }, 30000)
      }

      this.ws.onmessage = (event) => {
        if (event.data === 'pong') return
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Ошибка парсинга WebSocket сообщения:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('🔌 WebSocket соединение закрыто')
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('❌ Ошибка WebSocket:', error)
      }
    } catch (error) {
      console.error('❌ Ошибка создания WebSocket соединения:', error)
      this.attemptReconnect()
    }
  }

  private handleMessage(data: any) {
    if (data.type === 'ticket_updated') {
      const { action, ticket } = data
      let message = ''

      switch (action) {
        case 'created':
          message = `Создана новая заявка: ${ticket.title}`
          break
        case 'assigned':
          message = `Заявка назначена: ${ticket.title}`
          break
        case 'status_changed':
          message = `Изменен статус заявки: ${ticket.title}`
          break
        default:
          message = `Обновлена заявка: ${ticket.title}`
      }

      toast.success(message, {
        duration: 5000,
        position: 'top-right',
      })
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Превышено максимальное количество попыток переподключения')
      return
    }

    this.reconnectAttempts++
    console.log(`Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

    setTimeout(() => {
      this.createConnection()
    }, this.reconnectInterval)
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export const notificationSocket = new NotificationSocket()

export default api