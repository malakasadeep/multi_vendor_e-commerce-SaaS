import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";

interface Shop {
    id: string;
    name: string;
    address: string;
    bio?: string;
    category?: string;
    openingHours?: string;
    website?: string;
}

interface Seller {
    id: string;
    name: string;
    email: string;
    phone_number?: string;
    country?: string;
    shop?: Shop;
}

const fetchSeller = async (): Promise<Seller> => {
    const response = await axiosInstance.get('/api/logged-in-seller');
    return response.data.seller;
}

const useSeller = () => {
    const { data: seller, isLoading, isError, refetch } = useQuery<Seller>({
        queryKey: ['seller'],
        queryFn: fetchSeller,
        staleTime: 5 * 60 * 1000, // Cache user data for 5 minutes
        retry: false, // Don't retry on failure
    });
    return { seller, isLoading, isError, refetch };

}

export default useSeller;