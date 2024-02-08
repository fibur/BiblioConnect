# BiblioConnect

Projekt BiblioConnect zawiera kilka głównych komponentów, które składają się na kompleksowy system. Poniżej znajduje się szczegółowy opis każdego z folderów i plików w projekcie, a także instrukcje dotyczące uruchamiania systemu przy użyciu Docker.

## Struktura projektu

Projekt składa się z następujących głównych folderów:

- `backend`: Zawiera kod źródłowy i pliki konfiguracyjne dla backendu aplikacji we Flasku. Aplikacja stanowi mózg całego serwisu, udzielając dostęp do bazy danych, weryfikując dane wprowadzane przez endpointy i zarządzając użytkownikami + wypożyczeniami.
- `frontend`: Zawiera kod źródłowy interfejsu użytkownika aplikacji w React-JS. Jest on sercem serwisu, udostępniając prosty i przejrzysty interfejs użytkownika.
- `init-db-files`: Zawiera pliki SQL do inicjalizacji bazy danych. Oddzielne bazy muszą być utworzone dla `payment-mockup` i `backend`
- `payment-mockup`: Z racji iż integracja z zewnętrznym systemem płatności wykracza poza ramy projektu, ten serwis stanowi jego zastąpienie, udostępniając prostą stronę i logikę do tworzenia i obsługiwania płatności.

### Backend

W folderze `backend` znajdują się następujące pliki i podfoldery:

- `app`: Główny katalog aplikacji, zawierający logikę biznesową.
  - `templates`: Zawiera szablony HTML.
  - Pliki Pythona, takie jak `models.py`, `routes.py`, definiujące modele danych i trasy API.
- `Dockerfile`: Definicja obrazu Docker dla backendu.
- `requirements.txt`: Lista zależności Pythona wymaganych przez backend.
- `run.py`: Skrypt do uruchamiania aplikacji backendowej.
- `seed.py`: Skrypt do wypełniania bazy danych początkowymi danymi.

### Frontend

W folderze `frontend` znajdują się następujące pliki i podfoldery:

- `public`: Zawiera statyczne pliki, takie jak `index.html`.
- `src`: Zawiera kod źródłowy React aplikacji.
  - `components`: Zawiera komponenty React.
  - `context`: Zawiera konteksty React.
  - `service`: Zawiera serwisy do komunikacji z API.
  - `utils`: Zawiera pomocnicze funkcje i konfiguracje.
- `Dockerfile`: Definicja obrazu Docker dla frontendu.
- `package.json`: Plik konfiguracyjny Node.js, definiujący zależności i skrypty.

### Init-db-files

W folderze `init-db-files` znajdują się pliki SQL:

- `init-backend.sql`: Skrypt SQL do inicjalizacji bazy danych backendu.
- `init-payment.sql`: Skrypt SQL do inicjalizacji bazy danych dla serwisu płatności.

### Payment-mockup

W folderze `payment-mockup` znajdują się pliki konfiguracyjne i źródłowe dla prostego serwisu płatności:

- `app`: Katalog aplikacji, zawierający logikę biznesową serwisu płatności.
- `Dockerfile`: Definicja obrazu Docker dla serwisu płatności.
- `requirements.txt`: Lista zależności Pythona wymaganych przez serwis płatności.
- `run.py`: Skrypt do uruchamiania serwisu płatności.

## Uruchamianie w Dockerze

Aby uruchomić projekt BiblioConnect przy użyciu Docker, wykonaj następujące kroki:

1. Upewnij się, że Docker i Docker Compose są zainstalowane na Twoim systemie.
2. Otwórz terminal i przejdź do katalogu głównego projektu BiblioConnect.
3. Uruchom poniższą komendę, aby zbudować i uruchomić kontenery Docker zdefiniowane w `docker-compose.yml`:
```
docker-compose up --build
```
Po zakończeniu procesu budowy i uruchomienia, aplikacja frontendowa, backendowa oraz serwis płatności powinny działać, jednak prawodpodobnie serwisy `backend` oraz `payment-mockup` nie będa sie w stanie połączyć się z bazą przy pierwszym uruchomienia z racji iż baza jeszcze jest w stanie inicjalizacji. Wystarczy więc zresetować oba serwisy i wszystko powinno działać.

### Ładowanie przykładowych danych

Domyślnie baza danych jest pusta i nie zawiera żadnych książek. W rzeczywistym środowisku, baza danych byłaby wypełniana przez aplikację zewnętrzną a nie backend. 

Aby jednak możliwe było testowanie aplikacji, w folderze serwisu `backend` znajduje się skrypt `seed.py`, który wypełnia bazę przykładowymi książkami. Aby go uruchomić. należy dostac się do shell serwisu `backend`, a następnie wywołać komendę:

```
python seed.py
```

Po chwili dane powinny się pojawić w bazie. 

### Korzystanie z aplikacji

Aplikacja frontendowa powinna być dostępna w przeglądarce pod `http://localhost:3000` - z tego poziomu można już się zarejestrować i korzystać z serwisu. 
