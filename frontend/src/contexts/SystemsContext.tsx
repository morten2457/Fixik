import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { systemsAPI, System } from '../api/client';

interface SystemsContextType {
  systems: System[];
  isLoading: boolean;
  error: any;
  addSystem: (system: Omit<System, 'id'>) => Promise<System>;
  updateSystem: (id: number, updates: Partial<Omit<System, 'id'>>) => Promise<System>;
  deleteSystem: (id: number) => Promise<void>;
  getSystemColorMap: () => Record<string, { textColor: string; bgColor: string; borderColor: string }>;
}

const SystemsContext = createContext<SystemsContextType | undefined>(undefined);

export const SystemsProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const { data: systems = [], isLoading, error } = useQuery<System[]>('systems', systemsAPI.getAll, {
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/systems/ws`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => console.log('🔌 WebSocket систем подключен');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'systems_changed') {
            queryClient.invalidateQueries('systems');
          }
        } catch (err) {
          console.error('Ошибка парсинга WebSocket сообщения систем', err);
        }
      };
      ws.onclose = () => {
        console.log('🔌 WebSocket систем отключен, попытка переподключения через 3 сек');
        reconnectTimeout = setTimeout(connect, 3000);
      };
      ws.onerror = (error) => console.error('WebSocket систем ошибка', error);
    };

    connect();
    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, [queryClient]);

  const addMutation = useMutation(systemsAPI.create, {
    onSuccess: () => queryClient.invalidateQueries('systems'),
  });
  const updateMutation = useMutation(
    ({ id, updates }: { id: number; updates: Partial<Omit<System, 'id'>> }) => systemsAPI.update(id, updates),
    { onSuccess: () => queryClient.invalidateQueries('systems') }
  );
  const deleteMutation = useMutation(systemsAPI.delete, {
    onSuccess: () => queryClient.invalidateQueries('systems'),
  });

  const addSystem = async (system: Omit<System, 'id'>) => {
    return await addMutation.mutateAsync(system);
  };
  const updateSystem = async (id: number, updates: Partial<Omit<System, 'id'>>) => {
    return await updateMutation.mutateAsync({ id, updates });
  };
  const deleteSystem = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };
  const getSystemColorMap = () => {
    const map: Record<string, { textColor: string; bgColor: string; borderColor: string }> = {};
    systems.forEach(sys => {
      map[sys.name] = {
        textColor: sys.text_color,
        bgColor: sys.bg_color,
        borderColor: sys.border_color,
      };
    });
    return map;
  };

  return (
    <SystemsContext.Provider value={{ systems, isLoading, error, addSystem, updateSystem, deleteSystem, getSystemColorMap }}>
      {children}
    </SystemsContext.Provider>
  );
};

export const useSystems = () => {
  const context = useContext(SystemsContext);
  if (!context) throw new Error('useSystems must be used within SystemsProvider');
  return context;
};