import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { initialData } from './data/seed-data';
import { User } from 'src/auth/entities/user.entity';
import { AuthService } from 'src/auth/auth.service';


@Injectable()
export class SeedService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly usersService: AuthService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async runSeed() {
    await this.deleteTables();
    const adminUser = await this.insertUsers();

    await this.insertNewProducts(adminUser);
    return 'Seed completed';

  };
  private async insertUsers() {
    const seedUsers = initialData.users;
    const insertPromises:Promise<User>[] = seedUsers.map(async (user:User) => {
      return  this.usersService.create(user);
    });

    await Promise.all(insertPromises);
    return insertPromises[0];
  }

  private async deleteTables() {
    await this.productsService.deleteAllProducts();
    
    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder
    .delete()
    .where({})
    .execute();
  };



  private async insertNewProducts(user: User) {
   await this.productsService.deleteAllProducts();
    const seedProducts = initialData.products;
    const insertPromises = seedProducts.map(async (product) => {
      await this.productsService.create(product, user);
    });
    await Promise.all(insertPromises);

  };
}
