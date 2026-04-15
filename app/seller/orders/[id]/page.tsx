import { OrderDetailView } from "../_components/order-detail-view"

type Props = {
  params: Promise<{ id: string }>
}

export default async function SellerOrderDetailPage({ params }: Props) {
  const { id } = await params
  return <OrderDetailView orderId={id} />
}
