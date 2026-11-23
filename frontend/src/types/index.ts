export type FinishType = 'silver' | 'gold' | 'black' | 'bicolor';

export type SupplierPlatform =
  | 'SHOPEE'
  | 'TIKTOK'
  | 'ALIEXPRESS'
  | 'MERCADOLIVRE'
  | 'SHEIN'
  | 'TEMU'
  | 'DIRECT'
  | 'OTHER';

export interface Supplier {
  id: string;
  name: string;
  platform: SupplierPlatform;
  websiteUrl?: string;
  whatsapp?: string;
  email?: string;
  defaultCarrier: string;
  estimatedDeliveryDays: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  specifications?: string;
  careInstructions?: string;
  material: string;
  price: number;
  promotionalPrice?: number | null;
  rating: number;
  reviewsCount: number;
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  availableFinishes: FinishType[];
  availableSizes: string[];
  images: string[];
  categoryId: string;
  category?: Category;
  // Campos de Dropshipping
  supplierName?: string;
  supplierUrl?: string;
  supplierCost?: number;
  supplierPlatform?: SupplierPlatform;
  estimatedDeliveryDays?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  finish: FinishType;
  size?: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  productName: string;
  finish: string;
  size?: string | null;
  unitPrice: number;
  quantity: number;
  supplierName?: string;
  supplierUrl?: string;
  supplierCost?: number;
}

export type FulfillmentStatus = 
  | 'PENDING_SUPPLIER'  // Pago na loja, aguardando compra no fornecedor/loja parceira
  | 'ORDERED_SUPPLIER'  // Pedido realizado no fornecedor parceiro, aguardando envio
  | 'SHIPPED'           // Fornecedor postou, com código de rastreamento
  | 'DELIVERED';        // Entregue ao cliente final

export type OrderPaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  paymentStatus: OrderPaymentStatus;
  paymentId?: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  installments?: number;
  createdAt: string;
  items?: OrderItem[];
  // Campos de Dropshipping
  fulfillmentStatus: FulfillmentStatus;
  supplierOrderId?: string;
  supplierName?: string;
  supplierUrl?: string;
  trackingCode?: string;
  trackingCarrier?: string;
}

export interface OrderCreatePayload {
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCpf?: string;
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  paymentStatus?: OrderPaymentStatus;
  paymentId?: string;
  installments?: number;
  total?: number;
  subtotal?: number;
  discount?: number;
  items: Array<{
    productId: string;
    finish: string;
    size?: string;
    quantity: number;
  }>;
  couponCode?: string;
}
