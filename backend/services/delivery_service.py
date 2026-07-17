import asyncio
import logging
from datetime import datetime
from repositories.order_repository import OrderRepository
from repositories.delivery_repository import DeliveryPartnerRepository

logger = logging.getLogger("delivery_admin.delivery_service")
active_simulations = {}

class DeliveryService:
    @classmethod
    def start_simulation(cls, order_id: str):
        if order_id in active_simulations:
            return
        task = asyncio.create_task(cls.run_simulation(order_id))
        active_simulations[order_id] = task

    @classmethod
    async def run_simulation(cls, order_id: str):
        logger.info(f"[Simulation] Starting workflow for order: {order_id}")
        statuses = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Picked Up', 'Out for Delivery', 'Delivered']
        
        # Load order
        order = await OrderRepository.get_by_id(order_id)
        if not order:
            return
            
        if order.get("status") in ['Cancelled', 'Delivered']:
            return
            
        try:
            current_status_index = statuses.index(order.get("status", "Pending"))
        except ValueError:
            current_status_index = 0

        route_points = []
        start_lat = 40.7128
        start_lng = -74.0060
        end_lat = 40.7306
        end_lng = -73.9352
        steps = 12

        for i in range(steps + 1):
            fraction = i / steps
            route_points.append({
                "latitude": start_lat + (end_lat - start_lat) * fraction,
                "longitude": start_lng + (end_lng - start_lng) * fraction
            })
        route_index = 0

        from main import sio

        while True:
            await asyncio.sleep(4)
            order = await OrderRepository.get_by_id(order_id)
            if not order:
                break
                
            if order.get("status") == 'Cancelled':
                break

            if current_status_index < len(statuses) - 1:
                # If current status is not "Out for Delivery" or if it is and we finished routing
                if statuses[current_status_index] != 'Out for Delivery' or route_index >= len(route_points):
                    current_status_index += 1
                    next_status = statuses[current_status_index]
                    
                    # Update status
                    await OrderRepository.update(order_id, {"status": next_status, "updated_at": datetime.now()})
                    
                    description = f"Order is {next_status}"
                    if next_status == 'Accepted':
                        description = "Kitchen accepted the order details."
                    elif next_status == 'Preparing':
                        description = "Chef has started cooking your food."
                    elif next_status == 'Ready':
                        description = "Food has been packed and handed over to the courier."
                    elif next_status == 'Picked Up':
                        description = "Rider picked up package and is heading towards your location."
                    elif next_status == 'Out for Delivery':
                        description = "Rider is nearby. Please be ready to collect your food."
                    elif next_status == 'Delivered':
                        description = "Food delivered successfully! Payment verified."
                        
                    event = {
                        "status": next_status,
                        "timestamp": datetime.now().isoformat(),
                        "title": f"Order is {next_status}",
                        "description": description
                    }
                    await OrderRepository.add_timeline_event(order_id, event)
                    
                    updated_order = await OrderRepository.get_by_id(order_id)

                    if next_status == 'Delivered':
                        await OrderRepository.update(order_id, {"paymentStatus": "Paid"})
                        updated_order["paymentStatus"] = "Paid"
                        await sio.emit('order_status', { "status": 'Delivered', "timeline": updated_order["timeline"] }, room=order_id)
                        await sio.emit('order_confirmation_updated', updated_order)
                        break

                    await sio.emit('order_status', { "status": next_status, "timeline": updated_order["timeline"] }, room=order_id)
                    await sio.emit('order_confirmation_updated', updated_order)

            if order.get("status") == 'Out for Delivery':
                if route_index < len(route_points):
                    point = route_points[route_index]
                    eta = max(1, round((len(route_points) - route_index) * 1.5))
                    distance = float(f"{((len(route_points) - route_index) * 0.35):.2f}")

                    await sio.emit('rider_location', {
                        "latitude": point["latitude"],
                        "longitude": point["longitude"],
                        "etaMinutes": eta,
                        "distanceKm": distance,
                        "riderName": "Alex Mercer",
                        "riderPhone": "+1 555-0233",
                        "riderAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
                    }, room=order_id)
                    
                    # Update rider's location in database
                    await DeliveryPartnerRepository.update_location("rider-2", point["latitude"], point["longitude"])
                    route_index += 1
