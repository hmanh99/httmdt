from fastapi import APIRouter
from app.api.v1.endpoints import admin, auth, brands, cart, categories, orders, products, reviews, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(products.router)
api_router.include_router(categories.router)
api_router.include_router(brands.router)
api_router.include_router(cart.router)
api_router.include_router(orders.router)
api_router.include_router(reviews.router)
api_router.include_router(admin.router)

