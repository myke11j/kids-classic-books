# kids-classic-books
Lambda function for Alexa skill - kids-classic-books

## Inspiration

As a bibliophile, I wanted my Echo to tell me about books I want to read. It's rating, small description, publication year and much more. It's little easier than "googling it", as I can just ask for kids book to Alexa.

## What it does

It can retrieve any book's details from Goodreads which is labelled as children. User can ask this skill for any book, either by title or title and author, and this skill will return with some basic details like
- Publisher Name
- Publisher Year
- Goodread review count and rating
- Most popular genre for this book etc

If the book is not labelled as children book, then it will prompt the user and will ask to request some other book. So, a kid can't retreive information of a book, unless it's a Children Book.

## How I built it

I have used Nodejs, javascript and my own npm package [goodreads-json-api](https://www.npmjs.com/package/goodreads-json-api)

Based on user's request, I form the API and parse the response which can then be passed on to the user.

## Challenges I ran into

- Goodreads by default returns XML response, which is not that great for Lambda function. So, I created a custom package which can parse this xml and can return JSON friendly response.
- Parsing CDATA and XML tags was little tricky.

## Accomplishments that I'm proud of

## What I learned

Books are just awesome :)
Especially kids books. Because of developing this skill, I just re-read my own kids-classic The Jungle Book.

## What's next for Kids Classic Books

I have lots of things in pipeline, which I will be integrating in this skill.

- Machine Learning. Based on books requested by kids, this skill will be able to suggest books to that user.
- Fetches all time popular children's books.
- Fetches weekly popular children's books.