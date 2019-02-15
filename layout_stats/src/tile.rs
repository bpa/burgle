#[derive(Debug)]
pub struct Tile {
    pub n: bool,
    pub e: bool,
    pub s: bool,
    pub w: bool,
    pub walls: usize,
    pub heat: usize,
    pub distance: Vec<usize>,
}

impl Tile {
    pub fn reset(&mut self) {
        self.n = true;
        self.e = true;
        self.s = true;
        self.w = true;
        self.walls = 0;
        self.heat = 0;
        self.distance
            .iter_mut()
            .for_each(|d| *d = usize::max_value());
    }

    pub fn add_wall(&mut self) -> Result<(), ()> {
        self.walls += 1;
        if self.walls > 3 {
            Err(())
        } else {
            Ok(())
        }
    }

    pub fn set_n(&mut self) -> Result<(), ()> {
        self.add_wall()?;
        if self.n {
            self.n = false;
            Ok(())
        } else {
            Err(())
        }
    }

    pub fn set_e(&mut self) -> Result<(), ()> {
        self.add_wall()?;
        if self.e {
            self.e = false;
            Ok(())
        } else {
            Err(())
        }
    }

    pub fn set_s(&mut self) -> Result<(), ()> {
        self.add_wall()?;
        if self.s {
            self.s = false;
            Ok(())
        } else {
            Err(())
        }
    }

    pub fn set_w(&mut self) -> Result<(), ()> {
        self.add_wall()?;
        if self.w {
            self.w = false;
            Ok(())
        } else {
            Err(())
        }
    }
}
