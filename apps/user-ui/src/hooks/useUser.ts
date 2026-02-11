import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";

const fetchUser = async () => {
    const response = await axiosInstance.get('/api/logged-in-user');
    return response.data.user;
}

const useUser = () => {
    const { data: user, isLoading, isError, refetch } = useQuery({
        queryKey: ['user'],
        queryFn: fetchUser,
        staleTime: 5 * 60 * 1000, // Cache user data for 5 minutes
        retry: false, // Don't retry on failure
    });
    return { user, isLoading, isError, refetch };

}

export default useUser;