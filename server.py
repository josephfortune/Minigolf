import asyncio
import websockets
import json
from os import listdir
from os.path import isfile, join
import random

mapPath = "maps/"

nPlayers = 0
player1 = 0
player2 = 0

# Have they both loaded the map?
player1Loaded = False
player2Loaded = False

# Is their ball in the hole? (dont give them another turn)
p1_in_hole = False
p2_in_hole = False

# Don't issue a go ahead until both the shot_report and done_viewing are received
# for to make sure the turns stay in sync
shot_report_recieved = False
done_viewing_recieved = False

async def sendMsg(websocket, msg):
  print("Sending message: " + msg)
  await websocket.send(json.dumps({"type":"message", "msg":msg}))

async def broadcast(message):
  await sendMsg(player1, message)
  await sendMsg(player2, message)

def chooseRandomMap():
  # Get list of maps
  list = [f for f in listdir(mapPath) if isfile(join(mapPath, f))]
  nextMapName = random.choice(list)
  with open(mapPath + nextMapName) as f:
    map = f.read()
    return map
    
async def sendMap(websocket, map): 
  await websocket.send(map)
  print("Sending map")

async def hello(websocket, path):
  global nPlayers
  global player1
  global player2
  global player1Loaded
  global player2Loaded
  global p1_in_hole
  global p2_in_hole
  global shot_report_recieved
  global done_viewing_recieved

  # recieve initial message and parse JSON
  incoming = await websocket.recv()
  data = json.loads(incoming)
  
  # if "ready" message (client connecting)
  if data["type"] == "message" and data["msg"] =="ready":
    
    # if this is the first player joining
    if nPlayers == 0:
      nPlayers = 1;
      player1 = websocket
      print("Player 1 joined")
      await sendMsg(websocket, "Awaiting player 2")

    # if this is the second player joining
    elif nPlayers == 1:
      nPlayers = 2;
      player2 = websocket
      print("Player 2 joined")
      await sendMsg(websocket, "Joining as player 2")
      
      print("Sending map...")
      map = chooseRandomMap()
      await sendMap(player1, map)
      await sendMap(player2, map)

    # keep listening for future messages
    async for incoming in websocket:
      data = json.loads(incoming)

      if data["type"] == "message":
        print(data["msg"])
      
      # Map Loaded
      if data["type"] == "message":

        if data["msg"] == "map_loaded":
          if websocket == player1:
            player1Loaded = True
          elif websocket == player2:
            player2Loaded = True

          if player1Loaded and player2Loaded:
            await broadcast("Starting game")
            await sendMsg(player1, "go") # Player1's turn
            player1Loaded = False #Reset these so they don't get in the way
            player2Loaded = False


        elif data["msg"] == "viewing_complete": #The balls are done rolling
          done_viewing_recieved = True    

          # Check to see if its time to send the "go" signal
          if shot_report_recieved and done_viewing_recieved:
            print("shot_report and done_viewing recieved")
            shot_report_recieved = False # reset the vars
            done_viewing_recieved = False

            if websocket == player1:
              if not p1_in_hole:
                await sendMsg(player1, "go")
              elif not p2_in_hole:
                await sendMsg(player2, "go")
              else:
                await broadcast("Game over")

            elif websocket == player2:
              if not p2_in_hole:
                await sendMsg(player2, "go")
              elif not p1_in_hole:
                await sendMsg(player1, "go")
              else:
                await broadcast("Game over")

        
      elif data["type"] == "shot":    
        # If its a shot, no need to parse. Just forward it to opponent.
        if websocket == player1:
          await player2.send(incoming)
          print("Recieved shot from player1")
        elif websocket == player2:
          await player1.send(incoming)
          print("Recieved shot from player2")  
    
      elif data["type"] == "shot_report": 
        shot_report_recieved = True;

        if websocket == player1:
          # Check report to see if any players made it in the hole
          if data["hole1"] == True:
            p1_in_hole = True
          if data["hole2"] == True:
            p2_in_hole = True
          print("shot_report recieved from player1")

        # Check to see if its time to send the "go" signal
        # We check this here as well in case the two players get really out of sync
        # and the shot_report is sent after the done_viewing signal
        if shot_report_recieved and done_viewing_recieved:
          print("shot_report and done_viewing recieved")
          shot_report_recieved = False # reset the vars
          done_viewing_recieved = False

          if websocket == player1:
            if not p2_in_hole:
              await sendMsg(player2, "go")
            elif not p1_in_hole:
              await sendMsg(player1, "go")
            else:
              await broadcast("Game over")

          elif websocket == player2:
            if not p1_in_hole:
              await sendMsg(player1, "go")
            elif not p2_in_hole:
              await sendMsg(player2, "go")
            else:
              await broadcast("Game over")

        
        elif websocket == player2:
          # Check report to see if any players made it in the hole
          if data["hole1"] == True:
            p2_in_hole = True;
          if data["hole2"] == True:
            p1_in_hole = True;
          print("shot_report recieved from player2")

      else:
        print("Unknown message")
        
        
start_server = websockets.serve(hello, 'localhost', 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
