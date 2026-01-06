<?php

namespace App\Repository;

use App\Entity\Test;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Test>
 */
class TestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Test::class);
    }

    // Get tests for a specific student
    public function findTestsByStudent(int $studentId): array
    {
        return $this->createQueryBuilder('t')
            ->where('t.student = :studentId') // 'student' is ManyToOne property in Test entity
            ->setParameter('studentId', $studentId)
            ->getQuery()
            ->getArrayResult();
    }
}
