import { useEffect, useState } from "react";

export function useTypewriter(
  words: string[],
  typingSpeed = 120,
  deletingSpeed = 60,
  pauseTime = 1500
) {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0); // current word index
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[index % words.length];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      // typing forward
      if (text.length < currentWord.length) {
        timer = setTimeout(
          () => setText(currentWord.slice(0, text.length + 1)),
          typingSpeed
        );
      } else {
        timer = setTimeout(() => setIsDeleting(true), pauseTime);
      }
    } else {
      // deleting
      if (text.length > 0) {
        timer = setTimeout(
          () => setText(currentWord.slice(0, text.length - 1)),
          deletingSpeed
        );
      } else {
        setIsDeleting(false);
        setIndex((prev) => prev + 1);
      }
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, index, words, typingSpeed, deletingSpeed, pauseTime]);

  return text;
}
