# Outside facts used in the essay (checked 2026-11-23 by a research subagent; primary PDFs unless noted)

- Bayer & Diaconis 1992, "Trailing the dovetail shuffle to its lair" (Ann. Appl. Probab. 2:294-313;
  https://www.stat.berkeley.edu/~aldous/157/Papers/bayer_diaconis.pdf): TV for 52 cards k=5..10 .924 .614 .334 .167 .085 .043
  (our tvDistance reproduces). §5.1 card guessing: random deck 4.54; Table 5 (McGrath's strategy, no cut) k=1..10:
  31.17 19.69 12.92 8.80 6.56 5.51 5.01 4.76 4.65 4.60. "We do not know the optimal strategy." §2: rising sequences found
  by magicians Williams (1912) and Jordan (1916 on); Jordan's "Premo"; trick worked in 84% of simulations after 3 shuffles.
- Krityakierne & Thanatipanonda arXiv 2107.11142: McGrath's strategy is not optimal for k>=2. Liu arXiv 1908.07718: optimal for k=1.
- Diaconis, Fulman, Holmes 2013, "Analysis of casino shelf shuffling machines" (arXiv 1107.2961): ten shelves; "a knowledgeable
  player could guess about 9 1/2 cards correctly" (Table 2: 9.3) vs about 4 1/2; advice "use the machine twice" (= 8-9 riffles),
  "adopted by the manufacturer". President: "We are not pleased with your conclusions, but we believe them..."
- Overhand: Pemantle 1989 (bounds n^2 .. n^2 log n), Jonasson 2006 (n^2 log n lower bound). "2500"/"10,000" for 52 cards are
  folklore without a primary source: say "thousands", cite the order n^2 log n.
- Smooshing: Quanta 2015 (Diaconis, Coram, Bandklayder): 15 s failed adjacent-pairs test badly, 30 s and 60 s passed all 10 tests;
  "don't prove that 30 seconds is enough". Diaconis: "If you smoosh for a minute, it passes all the tests we've ever thrown at it."
- Trefethen & Trefethen 2000 (Proc. R. Soc. A 456): entropy, no cutoff; for 52 cards 3.52% of information remains after 5, 0.92% after 6.
- Assaf, Diaconis, Soundararajan 2011 (arXiv 0908.3462): for features like colours or one card, ~log2 n instead of 3/2 log2 n.
