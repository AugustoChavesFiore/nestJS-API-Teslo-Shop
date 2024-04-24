import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage, Product } from './entities';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productsImageRepository: Repository<ProductImage>,
    
    private readonly dataSource: DataSource,

  ) { }

  private readonly logger = new Logger('ProductsService');



  async create(createProductDto: CreateProductDto, user:User) {
    try {
      const { images = [], ...productDetails } = createProductDto;
      const product = this.productsRepository.create(
        {
          ...productDetails,
          user,
          images: images.map(image => this.productsImageRepository.create({ url: image })),
        }
      );
      await this.productsRepository.save(product);
      return { ...product, images };

    } catch (error) {
      this.handleDBException(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    try {
      const products = await this.productsRepository.find({
        take: limit,
        skip: offset,
        relations: {
          images: true
        }
      });

      return products.map(({ images, ...product }) => ({
        ...product,
        images: images.map(({ url }) => url)
      }));
    } catch (error) {
      this.handleDBException(error);
    }
  }

  async findOne(term: string) {
    let product: Product;

    try {
      if (isUUID(term)) {
        product = await this.productsRepository.findOneBy({ id: term });
      } else {
        const queryBuilder = this.productsRepository.createQueryBuilder('Product');
        product = await queryBuilder
          .where(`UPPER(title) =:title or slug =:slug`, {
            title: term.toLocaleUpperCase(),
            slug: term.toLocaleLowerCase()
          })
          .leftJoinAndSelect('Product.images', 'images')
          .getOne();
      }

      if (!product) throw new NotFoundException(`Product with term ${term} not found`);


      return { ...product, images: product.images.map(({ url }) => url) };

    } catch (error) {
      this.handleDBException(error);
    }
  };

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const { images, ...toUpdate } = updateProductDto;
    const product = await this.productsRepository.preload({
      id,
      ...toUpdate,
    });
    if (!product) throw new NotFoundException(`Product with id ${id} not found`);
    //Create Query Runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      if (images) {
       await queryRunner.manager.delete(ProductImage, { product: { id } });
        product.images = images.map(image => this.productsImageRepository.create({ url: image }));
      }else{
        product.images = await this.productsImageRepository.findBy({ product: { id } });
      }
      product.user = user;
      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return { ...product, images: product.images.map(({ url }) => url) };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBException(error);
    }
  }

  async remove(id: string) {
    try {
      const result = await this.productsRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Product with id ${id} not found`);
      }
    } catch (error) {
      this.handleDBException(error);
    }
    return
  }

  private handleDBException(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    };
    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error check server logs');
  }

  async deleteAllProducts() {
    const  queryBuilder = this.productsRepository.createQueryBuilder('Product');
    try {
      return await queryBuilder.delete().where({}).execute();
    } catch (error) {
      this.handleDBException(error);
    }
  }

};