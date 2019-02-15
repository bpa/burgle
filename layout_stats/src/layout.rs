use std::char;
use std::cmp;
use std::fmt;
use std::string::String;
use std::iter::FromIterator;

pub struct LayoutIter {
    state: Vec<usize>,
    walls: usize,
    bits: usize,
    end: usize,
    last: bool,
    display: usize,
    cmp: usize,
}

impl LayoutIter {
    pub fn new(size: usize, walls: usize) -> LayoutIter {
        let bits = size * (size - 1) * 2;
        let state: Vec<usize> = (0..walls).collect();
        // let state = (1..=walls).collect();
        // let state = vec![1, 2, 3, 4, 19, 20, 21, 22, 23, 24, 25, 26];
        let end = if bits - walls == 1 {
            1
        } else {
            (bits - walls) / 2
        };
        // let display = cmp::min(size, walls / 2 + 1);
        let display: usize = cmp::min(size, state.len() - 1);
        let cmp: usize = cmp::min(size - 1, state.len() - 1);

        LayoutIter {
            state,
            walls,
            bits,
            end,
            last: false,
            display: display,
            cmp: cmp,
        }
    }
}

impl Iterator for LayoutIter {
    type Item = Layout;

    fn next(&mut self) -> Option<Layout> {
        if self.last {
            None
        } else {
            let layout = Layout(self.state.clone());
            if self.state[0] == self.end {
                self.last = true;
                return Some(layout);
            }

            let mut i = self.state.len() - 1;
            loop {
                let mut offset = self.state[i] + 1;
                self.state[i] = offset;
                if offset > (self.bits - (self.walls - i)) {
                    i = i - 1;
                } else {
                    i += 1;
                    while i < self.walls {
                        offset += 1;
                        self.state[i] = offset;
                        i += 1;
                    }

                    break;
                }
            }

            // println!("{:?}", layout);
            if self.state[self.cmp] != layout.0[self.cmp] {
                println!("{:?}    \r", &layout.0[0..self.display]);
            }
            Some(layout)
        }
    }
}

#[derive(Clone, PartialEq, Debug)]
pub struct Layout(pub Vec<usize>);

impl fmt::Display for Layout {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let mut code: Vec<char> = Vec::new();
        let mut val: u64 = self.0.iter().map(|i| (1 as u64) << i).sum();

        while val > 0 {
            let num = val & 0b11111;
            code.push(char::from_digit(num as u32, 32).unwrap());
            val >>= 5;
        }

        code.reverse();
        write!(f, "{}", String::from_iter(code))
    }
}

mod tests {
    use crate::layout::{Layout, LayoutIter};
    use std::io::Write;
    use std::str;

    impl Layout {
        fn of(val: u64, walls: usize) -> Layout {
            let mut val = val;
            let mut vec = Vec::with_capacity(walls);
            let mut i = 0;
            while val > 0 {
                if val & 1 > 0 {
                    vec.push(i);
                }
                i += 1;
                val >>= 1;
            }
            Layout(vec)
        }
    }

    fn check_format(bits: u64, walls: usize, exp: &'static [u8]) {
        let mut d = Vec::new();
        write!(&mut d, "{}", Layout::of(bits, walls)).unwrap();
        assert_eq!(
            d,
            exp,
            "{:b}> {} != {}",
            bits,
            str::from_utf8(&d).unwrap(),
            str::from_utf8(exp).unwrap()
        );
    }

    #[test]
    fn test_layout() {
        check_format(0b000001, 1, b"1");
        check_format(0b000010, 1, b"2");
        check_format(0b010000, 1, b"g");
        check_format(0b111111, 6, b"1v");
        check_format(0b100000, 1, b"10");
        check_format(0b101000, 2, b"18");
    }

    #[test]
    fn test_layout_iter_2_1() {
        let mut it = LayoutIter::new(2, 1);
        assert_eq!(Some(Layout::of(0b0001, 1)), it.next());
        assert_eq!(Some(Layout::of(0b0010, 1)), it.next());
        assert_eq!(None, it.next());
    }

    #[test]
    fn test_layout_iter_2_2() {
        let mut it = LayoutIter::new(2, 2);
        assert_eq!(Some(Layout::of(0b0011, 2)), it.next());
        assert_eq!(Some(Layout::of(0b0101, 2)), it.next());
        assert_eq!(Some(Layout::of(0b1001, 2)), it.next());
        assert_eq!(Some(Layout::of(0b0110, 2)), it.next());
        assert_eq!(None, it.next());
    }

    #[test]
    fn test_layout_iter_2_3() {
        let mut it = LayoutIter::new(2, 3);
        assert_eq!(Some(Layout::of(0b0111, 3)), it.next());
        assert_eq!(Some(Layout::of(0b1011, 3)), it.next());
        assert_eq!(Some(Layout::of(0b1101, 3)), it.next());
        assert_eq!(Some(Layout::of(0b1110, 3)), it.next());
        assert_eq!(None, it.next());
    }

    #[test]
    fn test_layout_iter_2_4() {
        let mut it = LayoutIter::new(2, 4);
        assert_eq!(Some(Layout::of(0b1111, 4)), it.next());
        assert_eq!(None, it.next());
    }

    fn skip(it: &mut LayoutIter, num: usize) {
        for _ in 0..num {
            it.next();
        }
    }

    #[test]
    fn test_layout_iter_3_6() {
        let mut it = LayoutIter::new(3, 6);
        assert_eq!(Some(Layout::of(0b000000111111, 6)), it.next());
        skip(&mut it, 6);
        assert_eq!(Some(Layout::of(0b000001101111, 6)), it.next());
    }
}