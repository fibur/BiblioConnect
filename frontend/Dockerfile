# Wybór obrazu bazowego
FROM node:14

# Ustawienie katalogu roboczego w kontenerze
WORKDIR /app

# Kopiowanie plików package.json (i opcjonalnie package-lock.json) do kontenera
COPY package.json ./

# Instalacja zależności
RUN npm install

# Kopiowanie reszty plików projektu frontendu do kontenera
COPY . .

# Uruchomienie aplikacji React
CMD ["npm", "start"]
