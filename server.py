from agenda import server
from os import environ

# Roda um servidor local, para testes de desenvolvimento (http://localhost:5000)
if(__name__=="__main__"):
    server.run(host="0.0.0.0", port=environ.get("PORT", "5000"), debug=True)
