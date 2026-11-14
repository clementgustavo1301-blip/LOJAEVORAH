import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    category?: string;
    finish?: string;
    search?: string;
    sort?: string;
    featured?: boolean;
    bestSeller?: boolean;
    isNew?: boolean;
  }) {
    const where: any = {};

    if (params.category) {
      where.category = { slug: params.category };
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { description: { contains: params.search } },
      ];
    }

    if (params.finish) {
      where.availableFinishes = { contains: params.finish.toLowerCase() };
    }

    if (params.featured) {
      where.isFeatured = true;
    }

    if (params.bestSeller) {
      where.isBestSeller = true;
    }

    if (params.isNew) {
      where.isNew = true;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (params.sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (params.sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (params.sort === 'rating') {
      orderBy = { rating: 'desc' };
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
      },
    });

    return products.map(product => this.transformProduct(product));
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produto "${slug}" não encontrado`);
    }

    return this.transformProduct(product);
  }

  async getFeatured() {
    const products = await this.prisma.product.findMany({
      where: { isFeatured: true },
      take: 8,
      include: { category: true },
    });
    return products.map(product => this.transformProduct(product));
  }

  async getBestSellers() {
    const products = await this.prisma.product.findMany({
      where: { isBestSeller: true },
      take: 8,
      include: { category: true },
    });
    return products.map(product => this.transformProduct(product));
  }

  async getNewArrivals() {
    const products = await this.prisma.product.findMany({
      where: { isNew: true },
      take: 8,
      include: { category: true },
    });
    return products.map(product => this.transformProduct(product));
  }

  private transformProduct(product: any) {
    return {
      ...product,
      availableFinishes: JSON.parse(product.availableFinishes || '[]'),
      availableSizes: JSON.parse(product.availableSizes || '[]'),
      images: JSON.parse(product.images || '[]'),
    };
  }
}
