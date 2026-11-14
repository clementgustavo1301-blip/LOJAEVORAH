import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateOrderDto {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  shippingMethod: string;
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  items: Array<{
    productId: string;
    finish: string;
    size?: string;
    quantity: number;
  }>;
  couponCode?: string;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    let subtotal = 0;
    const orderItemsData: any[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Produto ${item.productId} não encontrado.`);
      }

      const unitPrice = product.promotionalPrice || product.price;
      subtotal += unitPrice * item.quantity;

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        finish: item.finish,
        size: item.size || null,
        unitPrice,
        quantity: item.quantity,
      });
    }

    let discount = 0;
    if (dto.couponCode?.toUpperCase() === 'BEMVINDO10') {
      discount = subtotal * 0.1;
    } else if (dto.couponCode?.toUpperCase() === 'INOX15') {
      discount = subtotal * 0.15;
    }

    if (dto.paymentMethod === 'PIX') {
      discount += (subtotal - discount) * 0.05; // 5% de desconto extra no PIX
    }

    const shippingCost = 0;
    const total = Math.max(0, subtotal - discount + shippingCost);

    const orderNumber = `INX-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        shippingAddress: JSON.stringify(dto.shippingAddress),
        shippingMethod: dto.shippingMethod || 'Expresso Seguro',
        paymentMethod: dto.paymentMethod,
        paymentStatus: 'APPROVED',
        subtotal,
        shippingCost,
        discount,
        total,
        installments: dto.paymentMethod === 'CREDIT_CARD' ? 6 : 1,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    return {
      success: true,
      orderNumber: order.orderNumber,
      total: order.total,
      subtotal: order.subtotal,
      discount: order.discount,
      shippingCost: order.shippingCost,
      paymentMethod: order.paymentMethod,
      customerEmail: order.customerEmail,
      createdAt: order.createdAt,
      pixQrCode: dto.paymentMethod === 'PIX' ? '00020126580014br.gov.bcb.pix0136inox-luxury-keys-pay-mock-brand2025520400005303986540' : null,
      pixCode: dto.paymentMethod === 'PIX' ? '00020126580014br.gov.bcb.pix0136inox-luxury-keys-pay-mock-brand2025' : null,
    };
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
      },
    });

    if (!order) return null;

    return {
      ...order,
      shippingAddress: JSON.parse(order.shippingAddress || '{}'),
    };
  }
}
