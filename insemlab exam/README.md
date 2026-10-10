# Experiment 4 – Create and Delete Specific Product

This lab uses the Spring Boot backend in `../ecommerce-backend`. Its existing `Product` entity maps all requested columns, `POST /api/products` inserts products, and `DELETE /api/products/{productId}` checks the ID and deletes the matching product.

## Product columns

`productId` (database-generated), `productName`, `category`, `description`, `price`, `stock`, `imageUrl`, `rating`, `status`.

## Run the backend

1. Start PostgreSQL and make sure the `ecomerce` database configured in `ecommerce-backend/src/main/resources/application.properties` exists and is accessible.
2. From `ecommerce-backend`, run `./mvnw spring-boot:run` (or `mvn spring-boot:run` if Maven is installed).
3. The API listens on `http://localhost:8080`.

## Test with Postman

Import `Experiment-4.postman_collection.json` into Postman. Run **Create product**, then **Delete created product**, then **Verify product is gone**. The collection saves the generated ID automatically for the later requests.

The delete request returns `200` on success. An unknown ID currently raises the service's `Product not found` exception. After deletion, `GET /api/products/{productId}` should return `404`.

## Verify in PostgreSQL

Before deleting, run:

```sql
SELECT * FROM products WHERE product_id = <productId>;
```

After deleting, run the same query; it should return zero rows. Hibernate maps the Java `productId` field to `product_id` by its naming strategy.

## Implementation files

- `ecommerce-backend/src/main/java/com/klu/model/Product.java` – product entity
- `ecommerce-backend/src/main/java/com/klu/repository/ProductRepository.java` – JPA repository
- `ecommerce-backend/src/main/java/com/klu/service/ProductService.java` – insert and existence-checked delete
- `ecommerce-backend/src/main/java/com/klu/controller/ProductController.java` – REST endpoints
