import { useState, useEffect, useCallback, useRef } from "react";
import usePrivateService from "./Auth/usePrivateService";

interface RowOrderMap {
  [entityId: number]: number;
}

export const useRowOrder = (entityType: string, data: any[]) => {
  const [rowOrderMap, setRowOrderMap] = useState<RowOrderMap>({});
  const [localOrderMap, setLocalOrderMap] = useState<RowOrderMap>({});
  const [loading, setLoading] = useState(false);
  const privateService = usePrivateService();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!entityType) return;

    const fetchRowOrders = async () => {
      try {
        setLoading(true);
        const response = await privateService.get(`/roworders?entityType=${entityType}`);
        const orders = response.data.data || [];
        
        const map: RowOrderMap = {};
        orders.forEach((order: any) => {
          map[order.entityId] = order.displayOrder;
        });
        
        setRowOrderMap(map);
        setLocalOrderMap(map);
      } catch (error) {
        console.error("Error fetching row orders:", error);
        setRowOrderMap({});
        setLocalOrderMap({});
      } finally {
        setLoading(false);
      }
    };

    fetchRowOrders();
  }, [entityType, privateService]);

  const sortedData = useCallback(() => {
    if (Object.keys(localOrderMap).length === 0) {
      return data;
    }

    return [...data].sort((a, b) => {
      const orderA = localOrderMap[a.id] ?? 999999;
      const orderB = localOrderMap[b.id] ?? 999999;
      return orderA - orderB;
    });
  }, [data, localOrderMap]);

  const handleReorder = useCallback(
    (reorderedData: any[]) => {
        // Create map based on the actual order passed in
        const newMap: RowOrderMap = {};
        reorderedData.forEach((item, index) => {
        newMap[item.id] = index;
        });

        console.log("New order map:", newMap);
        console.log("Reordered IDs:", reorderedData.map(d => d.id));
        setLocalOrderMap(newMap);

        if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        }

        // Save to backend
        saveTimeoutRef.current = setTimeout(() => {
        console.log("Saving to backend:", reorderedData.map((item, index) => ({
            entityId: item.id,
            displayOrder: index,
        })));
        
        privateService.post(`/roworders/batch`, {
            entityType,
            orders: reorderedData.map((item, index) => ({
            entityId: item.id,
            displayOrder: index,
            })),
        }).catch(err => console.error("Save error:", err));
        }, 500);
    },
    [entityType, privateService]
    );

  const resetOrder = useCallback(async () => {
    try {
      await privateService.delete(`/roworders`, {
        data: { entityType },
      });
      setRowOrderMap({});
      setLocalOrderMap({});
    } catch (error) {
      console.error("Error resetting row order:", error);
    }
  }, [entityType, privateService]);

  return {
    rowOrderMap,
    sortedData: sortedData(),
    handleReorder,
    resetOrder,
    loading,
  };
};