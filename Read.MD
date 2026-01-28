Implement Mtaaloop Trash Collection - How It Works
Customer Side (On the App):

Customer logs into Mtaaloop
Selects "Trash Collection" - Add a Trash Collection in Home.tsx What are you looking for section. 
Places order (30 shillings one-time OR weekly subscription)
Confirms pickup location (their doorstep/gate)
Gets notification - "Agent on the way"

Mtaaloop Operations Side:

Order received - System notifies nearest available agent
Agent accepts - Heads to customer location
Agent picks trash - From customer's doorstep
Order complete - Customer gets confirmation

Service Promise:

Response time: Agent arrives in less than 10 minutes
Full service: Pick up from doorstep → Transport → Dispose at garbage base
Customer does nothing: Just places order and puts trash outside

The agent is the rider.

This creates a win-win: customers get convenient trash disposal, agents get work, and Mtaaloop keeps neighborhoods clean!

You can help create a table trash_collection with the columns:
  1. customer_id : the user who requests for customer collection should be same as his userId
  2. estate_id
  3. amount
  4. status
  5. payment_status
  6. house
  7. full_name

You can go throught the application in creating the premium orders and how the rider handles it and create a similar one fortrash collection using the steps above. Make it simple and in a different page(the logic) so we dont tamper with the other logic.

I would advise to go trhough whole app logic ecspecialy how a premium order is handled to implement this steps.