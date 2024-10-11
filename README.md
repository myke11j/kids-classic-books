# Deprecated ⚠️ 
## Inspiration

As a bibliophile, I wanted my Echo to tell me about books I want to read. It's rating, small description, publication year and much more. It's little easier than "googling it", as I can just ask for kids book to Alexa.

## What it does

It can retrieve any book's details from Goodreads which is labeled as children. User can ask this skill for any book, either by title or title and author, and this skill will return with some basic details like
- Publisher Name
- Publisher Year
- Goodreads review count and rating
- Description
- List of similar books etc

If the book is not labeled as children book, then it will prompt the user and will ask to request some other book. So, a kid can't retrieve information for a book, unless it's a Children Book.

Sample utterances: 
- Alexa, ask kids classic, information for The Harry Potter by JK Rowlings
- Alexa, ask kids classic, information for The Great Wizard Wars from Christina Clarry
- Alexa, ask kids classic, to tell me about Where the Wild Things Are

## How I built it

I have used Nodejs, javascript and my own npm package [goodreads-json-api](https://www.npmjs.com/package/goodreads-json-api)

Based on user's request, I form the API and parse the response which can then be passed on to the user.

## Challenges I ran into

- Goodreads by default returns XML response, which is not that great for Lambda function. So, I created a custom package which can parse this xml and can return JSON friendly response.
- Parsing CDATA and XML tags was little tricky.
- Creating right user-voice experience was also one of highest priority while building this skill. Though, I'm still working on making this skill's voice experience even better for kids.

## Accomplishments that I'm proud of

- I'm glad, that I built something which allows kids to discover and learn. Instead of the searching book over the internet, they can play with this skills and in the process, learn a lot about various book titles.

## What I learned

Books are just awesome :)
Especially kids books. Because of developing this skill, I just re-read my own kids-classic The Jungle Book.

## What's next for Kids Classic Books

I have lots of things in the pipeline, which I will be integrating into this skill.

- Machine Learning. Based on books requested by kids, this skill will be able to suggest books to that user.
- Fetches all time popular children's books.
- Fetches weekly popular children's books.
