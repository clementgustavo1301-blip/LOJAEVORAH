import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('finish') finish?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('featured') featured?: string,
    @Query('bestSeller') bestSeller?: string,
    @Query('isNew') isNew?: string,
  ) {
    return this.productsService.findAll({
      category,
      finish,
      search,
      sort,
      featured: featured === 'true',
      bestSeller: bestSeller === 'true',
      isNew: isNew === 'true',
    });
  }

  @Get('featured')
  async getFeatured() {
    return this.productsService.getFeatured();
  }

  @Get('best-sellers')
  async getBestSellers() {
    return this.productsService.getBestSellers();
  }

  @Get('new-arrivals')
  async getNewArrivals() {
    return this.productsService.getNewArrivals();
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
