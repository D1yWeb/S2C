import { useLazyGetCheckoutQuery } from "@/redux/api/billing";
import { useAppSelector } from "@/redux/store";
import { toast } from "sonner";

export const useSubscriptionPlan = () => {
  const [trigger, { isFetching }] = useLazyGetCheckoutQuery();
  const { id } = useAppSelector((state) => state.profile);

  console.log(id);
  const onSubscribe = async () => {
    try {
      const res = await trigger(id).unwrap();
      
      // Validate response
      if (!res || !res.url) {
        console.error("Invalid checkout response:", res);
        toast.error("Invalid checkout response. Please try again.");
        return;
      }
      
      // hosted checkout
      window.location.href = res.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      
      // Extract error message
      let errorMessage = "Could not start checkout. Please try again.";
      
      if (err?.data?.error) {
        errorMessage = err.data.error;
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    }
  };

  return { onSubscribe, isFetching };
};
